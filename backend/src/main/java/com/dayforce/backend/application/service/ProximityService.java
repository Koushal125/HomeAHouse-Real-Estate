package com.dayforce.backend.application.service;

import com.dayforce.backend.application.dto.proximity.NearbyAmenityResponse;
import com.dayforce.backend.domain.entity.enums.AmenityType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpClient.Redirect;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
public class ProximityService {

    private static final int MAX_RESULTS_PER_TYPE = 3;
    private static final double SEARCH_RADIUS_METERS = 1_000; // 1 km
    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
    private static final List<String> OVERPASS_URLS = List.of(
            "https://overpass-api.de/api/interpreter",
            "https://lz4.overpass-api.de/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter"
    );

    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ProximityService() {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(Redirect.NORMAL)
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(30));
        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .defaultHeader("User-Agent", "HaHRealEstate/1.0")
                .defaultHeader("Accept", "application/json")
                .build();
    }

    /**
     * Public facade: geocodes an address and returns [lat, lon] if successful.
     * Used by PropertyService to auto-populate coordinates on property save.
     */
    public Optional<double[]> geocodeAddress(String streetName, String areaName, String landmark, String locality, String city) {
        for (String query : buildGeocodeCandidates(streetName, areaName, landmark, locality, city)) {
            double[] coords = geocode(query);
            if (coords != null) {
                return Optional.of(coords);
            }
        }
        return Optional.empty();
    }

    /**
     * Geocodes the given address and then queries Overpass for the nearest
     * hospital, school, and police station within {@value #SEARCH_RADIUS_METERS} m.
     *
     * @return a list with at most one entry per {@link AmenityType}; empty list if geocoding fails.
     */
    public List<NearbyAmenityResponse> fetchNearbyAmenities(String streetName, String areaName, String landmark, String locality, String city) {
        double[] coords = null;
        String matchedQuery = null;

        for (String query : buildGeocodeCandidates(streetName, areaName, landmark, locality, city)) {
            coords = geocode(query);
            if (coords != null) {
                matchedQuery = query;
                break;
            }
        }

        if (coords == null) {
            log.warn("Geocoding failed for streetName='{}', areaName='{}', landmark='{}', locality='{}', city='{}'", streetName, areaName, landmark, locality, city);
            return List.of();
        }

        double lat = coords[0];
        double lon = coords[1];
        log.info("Geocoded using query='{}' to lat={}, lon={} - querying Overpass", matchedQuery, lat, lon);
        return queryOverpass(lat, lon);
    }

    // ── Geocoding ────────────────────────────────────────────────────────────

    private double[] geocode(String query) {
        try {
            // .encode() before .build() is required so query param values are percent-encoded
            URI uri = UriComponentsBuilder.fromUriString(NOMINATIM_URL)
                    .queryParam("q", query)
                    .queryParam("format", "json")
                    .queryParam("limit", "1")
                    .encode()
                    .build()
                    .toUri();

            String body = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(String.class);

            log.debug("Nominatim response for '{}': {}", query, body);

            JsonNode root = objectMapper.readTree(body);
            if (root.isArray() && !root.isEmpty()) {
                JsonNode first = root.get(0);
                double lat = first.get("lat").asDouble();
                double lon = first.get("lon").asDouble();
                log.info("Nominatim found coords for '{}': lat={}, lon={}", query, lat, lon);
                return new double[]{lat, lon};
            }
            log.warn("Nominatim returned empty results for query='{}'", query);
        } catch (Exception e) {
            log.error("Nominatim call failed for '{}': {}", query, e.getMessage());
        }
        return null;
    }

    // ── Overpass query ───────────────────────────────────────────────────────

    private List<NearbyAmenityResponse> queryOverpass(double lat, double lon) {
        List<NearbyAmenityResponse> amenities = new ArrayList<>();
        for (AmenityType type : List.of(AmenityType.HOSPITAL, AmenityType.SCHOOL, AmenityType.POLICE_STATION)) {
            List<NearbyAmenityResponse> nearestAmenities = queryAmenities(type, lat, lon, SEARCH_RADIUS_METERS);
            if (nearestAmenities.isEmpty()) {
                log.warn("No {} found within {} meters. Retrying with a wider radius.", type, (int) SEARCH_RADIUS_METERS);
                nearestAmenities = queryAmenities(type, lat, lon, SEARCH_RADIUS_METERS * 2);
            }
            if (!nearestAmenities.isEmpty()) {
                amenities.addAll(nearestAmenities);
            }
        }
        return amenities;
    }

    private List<NearbyAmenityResponse> queryAmenities(AmenityType type, double lat, double lon, double radiusMeters) {
        String query = buildOverpassQuery(type, lat, lon, radiusMeters);
        for (String overpassUrl : OVERPASS_URLS) {
            try {
                String body = restClient.post()
                        .uri(overpassUrl)
                        .header("Content-Type", "application/x-www-form-urlencoded")
                        .body("data=" + java.net.URLEncoder.encode(query, java.nio.charset.StandardCharsets.UTF_8))
                        .retrieve()
                        .body(String.class);

                List<NearbyAmenityResponse> results = parseAmenityResponses(body, lat, lon, type);
                if (!results.isEmpty()) {
                    log.info("Overpass endpoint {} returned {} {} entries within {} meters", overpassUrl, results.size(), type, (int) radiusMeters);
                    return results;
                }
            } catch (Exception e) {
                log.warn("Overpass endpoint {} failed for {} at radius {}: {}", overpassUrl, type, (int) radiusMeters, e.getMessage());
            }
        }
        return List.of();
    }

    private String buildOverpassQuery(AmenityType type, double lat, double lon, double radiusMeters) {
        String r = String.valueOf((int) radiusMeters);
        String ll = lat + "," + lon;
        List<String[]> tagPairs = switch (type) {
            case HOSPITAL -> List.<String[]>of(
                    new String[]{"amenity", "hospital"},
                    new String[]{"healthcare", "hospital"},
                    new String[]{"amenity", "clinic"}
            );
            case SCHOOL -> List.<String[]>of(
                    new String[]{"amenity", "school"},
                    new String[]{"amenity", "college"},
                    new String[]{"amenity", "university"}
            );
            case POLICE_STATION -> List.<String[]>of(
                    new String[]{"amenity", "police"}
            );
        };

        StringBuilder query = new StringBuilder("[out:json][timeout:20];\n(\n");
        for (String[] tagPair : tagPairs) {
            appendOverpassClause(query, "node", tagPair[0], tagPair[1], r, ll);
            appendOverpassClause(query, "way", tagPair[0], tagPair[1], r, ll);
            appendOverpassClause(query, "relation", tagPair[0], tagPair[1], r, ll);
        }
        query.append(");\nout center;");
        return query.toString();
    }

    private List<NearbyAmenityResponse> parseAmenityResponses(String json, double propLat, double propLon, AmenityType expectedType) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        JsonNode elements = root.get("elements");

        Map<String, NearbyAmenityResponse> uniqueAmenities = new HashMap<>();

        if (elements != null && elements.isArray()) {
            for (JsonNode el : elements) {
                double elLat = resolveLatLon(el, "lat");
                double elLon = resolveLatLon(el, "lon");
                if (Double.isNaN(elLat) || Double.isNaN(elLon)) continue;

                JsonNode tags = el.get("tags");
                if (tags == null) continue;

                String amenityTag  = tags.has("amenity")    ? tags.get("amenity").asText("")    : "";
                String healthcareTag = tags.has("healthcare") ? tags.get("healthcare").asText("") : "";

                AmenityType amenityType = resolveAmenityType(amenityTag, healthcareTag);
                if (amenityType == null || amenityType != expectedType) continue;

                String name = tags.has("name")    ? tags.get("name").asText("").trim()    : "";
                if (name.isBlank()) name = tags.has("name:en") ? tags.get("name:en").asText("").trim() : "";
                if (name.isBlank()) name = toDisplayName(amenityType);

                String addr   = resolveAddress(tags);
                double distKm = haversine(propLat, propLon, elLat, elLon);

                NearbyAmenityResponse candidate = NearbyAmenityResponse.builder()
                        .type(expectedType)
                        .name(name)
                        .address(addr)
                        .distanceKm(round2(distKm))
                        .autoFetched(true)
                        .build();

                String key = buildAmenityKey(expectedType, name, addr);
                NearbyAmenityResponse existing = uniqueAmenities.get(key);
                if (existing == null || candidate.getDistanceKm() < existing.getDistanceKm()) {
                    uniqueAmenities.put(key, candidate);
                }
            }
        }

        return uniqueAmenities.values().stream()
                .sorted(Comparator.comparingDouble(NearbyAmenityResponse::getDistanceKm))
                .limit(MAX_RESULTS_PER_TYPE)
                .toList();
    }

    private void appendOverpassClause(StringBuilder query, String objectType, String tagKey, String tagValue, String radius, String latLon) {
        query.append("  ")
                .append(objectType)
                .append("[\"")
                .append(tagKey)
                .append("\"=\"")
                .append(tagValue)
                .append("\"](around:")
                .append(radius)
                .append(",")
                .append(latLon)
                .append(");\n");
    }

    private String buildAmenityKey(AmenityType type, String name, String address) {
        return type + "|" + name.trim().toLowerCase() + "|" + address.trim().toLowerCase();
    }

    /** Maps raw OSM amenity/healthcare tags to our internal AmenityType. Returns null if unrecognised. */
    private AmenityType resolveAmenityType(String amenityTag, String healthcareTag) {
        return switch (amenityTag) {
            case "hospital", "clinic" -> AmenityType.HOSPITAL;
            case "school", "college", "university" -> AmenityType.SCHOOL;
            case "police"             -> AmenityType.POLICE_STATION;
            default -> "hospital".equals(healthcareTag) ? AmenityType.HOSPITAL : null;
        };
    }

    private List<String> buildGeocodeCandidates(String streetName, String areaName, String landmark, String locality, String city) {
        Set<String> queries = new LinkedHashSet<>();
        addQuery(queries, areaName, landmark, locality, city, "India");
        addQuery(queries, landmark, locality, city, "India");
        addQuery(queries, areaName, locality, city, "India");
        addQuery(queries, streetName, areaName, landmark, locality, city, "India");
        addQuery(queries, streetName, locality, city, "India");
        addQuery(queries, locality, city, "India");
        addQuery(queries, city, "India");
        return new ArrayList<>(queries);
    }

    private void addQuery(Set<String> queries, String... parts) {
        List<String> cleaned = new ArrayList<>();
        for (String part : parts) {
            if (part == null) {
                continue;
            }
            String normalized = part.trim();
            if (!normalized.isBlank()) {
                cleaned.add(normalized);
            }
        }
        if (!cleaned.isEmpty()) {
            queries.add(String.join(", ", cleaned));
        }
    }

    /** Human-readable fallback name when OSM has no name tag. */
    private String toDisplayName(AmenityType type) {
        return switch (type) {
            case HOSPITAL       -> "Nearby Hospital";
            case SCHOOL         -> "Nearby School";
            case POLICE_STATION -> "Nearby Police Station";
        };
    }

    private double resolveLatLon(JsonNode el, String field) {
        if (el.has(field)) return el.get(field).asDouble(Double.NaN);
        // ways have a "center" object
        JsonNode center = el.get("center");
        if (center != null && center.has(field)) return center.get(field).asDouble(Double.NaN);
        return Double.NaN;
    }

    private String resolveAddress(JsonNode tags) {
        if (tags.has("addr:full")) return tags.get("addr:full").asText();
        StringBuilder sb = new StringBuilder();
        if (tags.has("addr:housenumber")) sb.append(tags.get("addr:housenumber").asText()).append(", ");
        if (tags.has("addr:street"))      sb.append(tags.get("addr:street").asText()).append(", ");
        if (tags.has("addr:city"))        sb.append(tags.get("addr:city").asText());
        String result = sb.toString().replaceAll(",\\s*$", "").trim();
        return result.isBlank() ? "Address not available" : result;
    }

    /** Haversine formula — returns distance in kilometres. */
    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
