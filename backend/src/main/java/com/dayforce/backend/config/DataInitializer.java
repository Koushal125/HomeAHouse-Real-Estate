package com.dayforce.backend.config;

import com.dayforce.backend.domain.entity.*;
import com.dayforce.backend.domain.entity.enums.*;
import com.dayforce.backend.infrastructure.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Seeds the database with realistic rental and for-sale property data for development.
 * Only active under the "dev" Spring profile.
 *
 * Idempotency: guarded by checking for the sentinel e-mail "seed.broker1@hah.com".
 * Using count() > 0 would be wrong because the developer may already have properties
 * in the database from manual testing.
 *
 * Seed credentials (plain-text, dev only):
 *   Brokers:
 *     seed.broker1@hah.com / Seed@1234  — Rajesh Sharma   (Mumbai)
 *     seed.broker2@hah.com / Seed@1234  — Priya Nair      (Delhi)
 *     seed.broker3@hah.com / Seed@1234  — Arjun Mehta     (Bengaluru)
 *
 *   Customers:
 *     seed.cust1@hah.com   / Seed@1234  — Ananya Iyer     (Mumbai)
 *     seed.cust2@hah.com   / Seed@1234  — Karan Malhotra  (Delhi)
 *     seed.cust3@hah.com   / Seed@1234  — Sneha Reddy     (Bengaluru)
 *     seed.cust4@hah.com   / Seed@1234  — Vikram Patel    (Pune)
 */
@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataInitializer {

    private final UserRepository        userRepository;
    private final BrokerRepository      brokerRepository;
    private final CustomerRepository    customerRepository;
    private final PropertyRepository    propertyRepository;
    private final PropertyImageRepository propertyImageRepository;
    private final NearbyAmenityRepository nearbyAmenityRepository;
    private final DealRepository        dealRepository;
    private final PasswordEncoder       passwordEncoder;

    // ── City-centre lat/lon (slight per-property offset added in helper) ──────
    private static final double[] MUMBAI_LAT_LNG    = {19.0760, 72.8777};
    private static final double[] DELHI_LAT_LNG     = {28.6139, 77.2090};
    private static final double[] BENGALURU_LAT_LNG = {12.9716, 77.5946};
    private static final double[] PUNE_LAT_LNG      = {18.5204, 73.8567};
    private static final double[] HYDERABAD_LAT_LNG = {17.3850, 78.4867};

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        if (userRepository.findByEmail("seed.broker1@hah.com").isPresent()) {
            log.info("DataInitializer: seed data already present — skipping.");
            return;
        }

        log.info("DataInitializer: seeding brokers, customers, properties, images, amenities and deals…");

        // ── 1. Brokers ─────────────────────────────────────────────────────────
        Broker broker1 = createBroker("Rajesh Sharma",   "seed.broker1@hah.com", "9876543210", "Mumbai");
        Broker broker2 = createBroker("Priya Nair",      "seed.broker2@hah.com", "9876543211", "Delhi");
        Broker broker3 = createBroker("Arjun Mehta",     "seed.broker3@hah.com", "9876543212", "Bengaluru");

        // ── 2. Customers ───────────────────────────────────────────────────────
        Customer cust1 = createCustomer("Ananya Iyer",    "seed.cust1@hah.com", "9123456781", "Mumbai");
        Customer cust2 = createCustomer("Karan Malhotra", "seed.cust2@hah.com", "9123456782", "Delhi");
        Customer cust3 = createCustomer("Sneha Reddy",    "seed.cust3@hah.com", "9123456783", "Bengaluru");
        Customer cust4 = createCustomer("Vikram Patel",   "seed.cust4@hah.com", "9123456784", "Pune");

        Customer[] customers = {cust1, cust2, cust3, cust4};

        // ── 3. Properties ─────────────────────────────────────────────────────
        // Each record: title, config, offerType, propType, cost, sqft, beds, baths, furnished,
        //              street, area, landmark, locality, city, broker, lat[], offset-index
        List<Property> props = List.of(

            // ── FOR SALE (25) ─────────────────────────────────────────────────
            prop("Spacious 3BHK Sea-View Apartment", "3BHK", OfferType.SELL,
                    PropertyType.APARTMENT, 18500000, 1450, 3, 2, true,
                    "Marine Drive", "Nariman Point", "Oberoi Hotel", "South Mumbai", "Mumbai",
                    broker1, MUMBAI_LAT_LNG, 0),

            prop("Luxury Villa with Pool", "4BHK", OfferType.SELL,
                    PropertyType.VILLA, 45000000, 4200, 4, 4, true,
                    "Linking Road", "Bandra West", "Lilavati Hospital", "Bandra", "Mumbai",
                    broker1, MUMBAI_LAT_LNG, 1),

            prop("Modern 2BHK Flat in Powai", "2BHK", OfferType.SELL,
                    PropertyType.FLAT, 9800000, 950, 2, 2, true,
                    "Hiranandani Gardens", "Powai", "IIT Bombay Gate", "Powai", "Mumbai",
                    broker1, MUMBAI_LAT_LNG, 2),

            prop("Ready-to-Move 1BHK Apartment", "1BHK", OfferType.SELL,
                    PropertyType.APARTMENT, 5500000, 560, 1, 1, false,
                    "LBS Marg", "Ghatkopar West", "R-City Mall", "Ghatkopar", "Mumbai",
                    broker1, MUMBAI_LAT_LNG, 3),

            prop("Prime Commercial Shop", "Commercial", OfferType.SELL,
                    PropertyType.SHOP, 7200000, 380, 0, 1, false,
                    "Colaba Causeway", "Colaba", "Gateway of India", "Colaba", "Mumbai",
                    broker1, MUMBAI_LAT_LNG, 4),

            prop("Residential Plot in Thane", "Plot", OfferType.SELL,
                    PropertyType.PLOT, 6500000, 2400, 0, 0, false,
                    "Ghodbunder Road", "Thane West", "Viviana Mall", "Thane", "Mumbai",
                    broker1, MUMBAI_LAT_LNG, 5),

            prop("Premium 3BHK in South Delhi", "3BHK", OfferType.SELL,
                    PropertyType.APARTMENT, 22000000, 1750, 3, 3, true,
                    "Golf Links Road", "Golf Links", "India Gate", "South Delhi", "Delhi",
                    broker2, DELHI_LAT_LNG, 0),

            prop("Independent House in Vasant Kunj", "4BHK", OfferType.SELL,
                    PropertyType.HOUSE, 35000000, 3200, 4, 3, true,
                    "Sector C", "Vasant Kunj", "DLF Promenade", "Vasant Kunj", "Delhi",
                    broker2, DELHI_LAT_LNG, 1),

            prop("Affordable 2BHK in Dwarka", "2BHK", OfferType.SELL,
                    PropertyType.FLAT, 7200000, 875, 2, 2, false,
                    "Sector 12", "Dwarka", "Dwarka Metro", "Dwarka", "Delhi",
                    broker2, DELHI_LAT_LNG, 2),

            prop("Studio Apartment near Connaught Place", "Studio", OfferType.SELL,
                    PropertyType.APARTMENT, 4800000, 420, 1, 1, true,
                    "Janpath", "Connaught Place", "Palika Bazaar", "Central Delhi", "Delhi",
                    broker2, DELHI_LAT_LNG, 3),

            prop("Commercial Office Space in Nehru Place", "Commercial", OfferType.SELL,
                    PropertyType.COMMERCIAL, 12500000, 850, 0, 2, false,
                    "Nehru Place", "South Delhi", "IFFCO Chowk", "Nehru Place", "Delhi",
                    broker2, DELHI_LAT_LNG, 4),

            prop("Elegant Villa in Whitefield", "4BHK", OfferType.SELL,
                    PropertyType.VILLA, 38000000, 5000, 4, 4, true,
                    "ITPL Main Road", "Whitefield", "ITPL Gate", "Whitefield", "Bengaluru",
                    broker3, BENGALURU_LAT_LNG, 0),

            prop("IT-Hub 3BHK Flat in Koramangala", "3BHK", OfferType.SELL,
                    PropertyType.FLAT, 14500000, 1350, 3, 2, true,
                    "80 Feet Road", "Koramangala 5th Block", "Forum Mall", "Koramangala", "Bengaluru",
                    broker3, BENGALURU_LAT_LNG, 1),

            prop("2BHK Apartment in Electronic City", "2BHK", OfferType.SELL,
                    PropertyType.APARTMENT, 6800000, 920, 2, 2, false,
                    "Hosur Road", "Electronic City Phase 1", "Infosys Gate", "Electronic City", "Bengaluru",
                    broker3, BENGALURU_LAT_LNG, 2),

            prop("Commercial Plot in Outer Ring Road", "Plot", OfferType.SELL,
                    PropertyType.PLOT, 9500000, 3600, 0, 0, false,
                    "Outer Ring Road", "Bellandur", "Eco Space", "Bellandur", "Bengaluru",
                    broker3, BENGALURU_LAT_LNG, 3),

            prop("Cosy 1BHK in Indiranagar", "1BHK", OfferType.SELL,
                    PropertyType.APARTMENT, 5200000, 580, 1, 1, true,
                    "100 Feet Road", "Indiranagar", "CMH Road Junction", "Indiranagar", "Bengaluru",
                    broker3, BENGALURU_LAT_LNG, 4),

            prop("Spacious 3BHK in Baner", "3BHK", OfferType.SELL,
                    PropertyType.APARTMENT, 11000000, 1400, 3, 2, true,
                    "Baner Road", "Baner", "Balewadi Stadium", "Baner", "Pune",
                    broker1, PUNE_LAT_LNG, 0),

            prop("Gated Community Villa in Wakad", "4BHK", OfferType.SELL,
                    PropertyType.VILLA, 28000000, 3800, 4, 4, true,
                    "Wakad Road", "Wakad", "Xion Mall", "Pimpri-Chinchwad", "Pune",
                    broker1, PUNE_LAT_LNG, 1),

            prop("Budget 2BHK Flat in Hadapsar", "2BHK", OfferType.SELL,
                    PropertyType.FLAT, 5600000, 820, 2, 1, false,
                    "Magarpatta Road", "Hadapsar", "Amanora Mall", "Hadapsar", "Pune",
                    broker1, PUNE_LAT_LNG, 2),

            prop("Shop in Model Colony", "Commercial", OfferType.SELL,
                    PropertyType.SHOP, 4200000, 260, 0, 1, false,
                    "Senapati Bapat Road", "Model Colony", "Chaturshringi Temple", "Shivajinagar", "Pune",
                    broker2, PUNE_LAT_LNG, 3),

            prop("Luxury 3BHK in Jubilee Hills", "3BHK", OfferType.SELL,
                    PropertyType.APARTMENT, 19500000, 1800, 3, 3, true,
                    "Road No 36", "Jubilee Hills", "Film Nagar", "Jubilee Hills", "Hyderabad",
                    broker2, HYDERABAD_LAT_LNG, 0),

            prop("Independent House in Banjara Hills", "4BHK", OfferType.SELL,
                    PropertyType.HOUSE, 42000000, 4000, 4, 4, true,
                    "Road No 12", "Banjara Hills", "KBR Park", "Banjara Hills", "Hyderabad",
                    broker2, HYDERABAD_LAT_LNG, 1),

            prop("Affordable 2BHK in Kukatpally", "2BHK", OfferType.SELL,
                    PropertyType.FLAT, 6000000, 870, 2, 2, false,
                    "KPHB Colony", "Kukatpally", "JNTU Metro", "Kukatpally", "Hyderabad",
                    broker3, HYDERABAD_LAT_LNG, 2),

            prop("Commercial Office in HITEC City", "Commercial", OfferType.SELL,
                    PropertyType.COMMERCIAL, 16000000, 1100, 0, 2, false,
                    "Madhapur Main Road", "HITEC City", "Cyber Towers", "Madhapur", "Hyderabad",
                    broker3, HYDERABAD_LAT_LNG, 3),

            prop("Studio Flat in Ameerpet", "Studio", OfferType.SELL,
                    PropertyType.FLAT, 3500000, 390, 1, 1, true,
                    "Ameerpet Main Road", "Ameerpet", "Ameerpet Metro", "Ameerpet", "Hyderabad",
                    broker3, HYDERABAD_LAT_LNG, 4),

            // ── RENT LONG-TERM (25) ───────────────────────────────────────────
            prop("Furnished 2BHK near BKC", "2BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.FLAT, 55000, 900, 2, 2, true,
                    "BKC Road", "Bandra Kurla Complex", "Sofitel Hotel", "BKC", "Mumbai",
                    broker1, MUMBAI_LAT_LNG, 6),

            prop("Spacious 3BHK in Andheri West", "3BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.APARTMENT, 70000, 1300, 3, 2, true,
                    "Versova Road", "Andheri West", "DN Nagar Metro", "Andheri", "Mumbai",
                    broker1, MUMBAI_LAT_LNG, 7),

            prop("1BHK Flat in Malad East", "1BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.FLAT, 22000, 550, 1, 1, false,
                    "Marve Road", "Malad East", "Malad Station", "Malad", "Mumbai",
                    broker1, MUMBAI_LAT_LNG, 8),

            prop("Semi-Furnished 2BHK in Chembur", "2BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.FLAT, 32000, 820, 2, 1, false,
                    "Eastern Express Highway", "Chembur", "Chembur Station", "Chembur", "Mumbai",
                    broker1, MUMBAI_LAT_LNG, 9),

            prop("Studio near Lower Parel", "Studio", OfferType.RENT_LONG_TERM,
                    PropertyType.APARTMENT, 28000, 400, 1, 1, true,
                    "Senapati Bapat Marg", "Lower Parel", "Phoenix Mills", "Lower Parel", "Mumbai",
                    broker1, MUMBAI_LAT_LNG, 10),

            prop("Luxury 3BHK in Greater Kailash", "3BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.APARTMENT, 80000, 1600, 3, 3, true,
                    "GK-I M Block", "Greater Kailash I", "GK Market", "South Delhi", "Delhi",
                    broker2, DELHI_LAT_LNG, 5),

            prop("2BHK Flat in Rohini", "2BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.FLAT, 18000, 780, 2, 1, false,
                    "Sector 15", "Rohini", "Rohini East Metro", "Rohini", "Delhi",
                    broker2, DELHI_LAT_LNG, 6),

            prop("1BHK in Laxmi Nagar", "1BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.FLAT, 12000, 480, 1, 1, false,
                    "Vikas Marg", "Laxmi Nagar", "Laxmi Nagar Metro", "East Delhi", "Delhi",
                    broker2, DELHI_LAT_LNG, 7),

            prop("Furnished Studio near CP", "Studio", OfferType.RENT_LONG_TERM,
                    PropertyType.APARTMENT, 22000, 380, 1, 1, true,
                    "Kasturba Gandhi Marg", "Connaught Place", "Rajiv Chowk Metro", "Central Delhi", "Delhi",
                    broker2, DELHI_LAT_LNG, 8),

            prop("Spacious 4BHK Independent House", "4BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.HOUSE, 120000, 3200, 4, 3, true,
                    "Sunder Nagar", "Sunder Nagar", "Khan Market", "South Delhi", "Delhi",
                    broker2, DELHI_LAT_LNG, 9),

            prop("Modern 2BHK in HSR Layout", "2BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.FLAT, 30000, 980, 2, 2, true,
                    "27th Main Road", "HSR Layout Sector 2", "Agara Lake", "HSR Layout", "Bengaluru",
                    broker3, BENGALURU_LAT_LNG, 5),

            prop("3BHK near Manyata Tech Park", "3BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.APARTMENT, 45000, 1400, 3, 2, true,
                    "Hebbal Ring Road", "Hebbal", "Manyata Entrance", "Hebbal", "Bengaluru",
                    broker3, BENGALURU_LAT_LNG, 6),

            prop("1BHK in BTM Layout", "1BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.FLAT, 14000, 520, 1, 1, false,
                    "BTM 2nd Stage", "BTM Layout", "Silkboard Junction", "BTM Layout", "Bengaluru",
                    broker3, BENGALURU_LAT_LNG, 7),

            prop("Furnished Apartment near Marathahalli", "2BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.APARTMENT, 28000, 850, 2, 2, true,
                    "Varthur Main Road", "Marathahalli", "Spice Garden", "Marathahalli", "Bengaluru",
                    broker3, BENGALURU_LAT_LNG, 8),

            prop("Studio in Jayanagar", "Studio", OfferType.RENT_LONG_TERM,
                    PropertyType.FLAT, 16000, 420, 1, 1, true,
                    "11th Main, 4th Block", "Jayanagar", "Jayanagar Shopping Complex", "Jayanagar", "Bengaluru",
                    broker3, BENGALURU_LAT_LNG, 9),

            prop("2BHK Flat in Shivajinagar", "2BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.FLAT, 20000, 790, 2, 1, false,
                    "FC Road", "Shivajinagar", "Fergusson College", "Shivajinagar", "Pune",
                    broker1, PUNE_LAT_LNG, 4),

            prop("3BHK in Aundh", "3BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.APARTMENT, 35000, 1300, 3, 2, true,
                    "ITI Road", "Aundh", "Westend Mall", "Aundh", "Pune",
                    broker1, PUNE_LAT_LNG, 5),

            prop("1BHK in Kothrud", "1BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.FLAT, 13000, 530, 1, 1, false,
                    "Paud Road", "Kothrud", "Garware College", "Kothrud", "Pune",
                    broker2, PUNE_LAT_LNG, 5),

            prop("Furnished 2BHK in Viman Nagar", "2BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.APARTMENT, 28000, 870, 2, 2, true,
                    "Viman Nagar Road", "Viman Nagar", "Phoenix Marketcity", "Viman Nagar", "Pune",
                    broker2, PUNE_LAT_LNG, 6),

            prop("3BHK near Gachibowli", "3BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.APARTMENT, 48000, 1450, 3, 2, true,
                    "Financial District", "Gachibowli", "DLF Cybercity", "Gachibowli", "Hyderabad",
                    broker2, HYDERABAD_LAT_LNG, 5),

            prop("2BHK Flat in Madhapur", "2BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.FLAT, 28000, 920, 2, 2, true,
                    "Ayyappa Society", "Madhapur", "Hitech City Metro", "Madhapur", "Hyderabad",
                    broker3, HYDERABAD_LAT_LNG, 5),

            prop("1BHK near Begumpet", "1BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.FLAT, 15000, 520, 1, 1, false,
                    "Raj Bhavan Road", "Begumpet", "Begumpet Airport", "Begumpet", "Hyderabad",
                    broker3, HYDERABAD_LAT_LNG, 6),

            prop("Semi-Furnished 3BHK in Kondapur", "3BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.APARTMENT, 38000, 1380, 3, 2, false,
                    "Kondapur Main Road", "Kondapur", "Botanical Garden", "Kondapur", "Hyderabad",
                    broker3, HYDERABAD_LAT_LNG, 7),

            prop("Studio in Ameerpet", "Studio", OfferType.RENT_LONG_TERM,
                    PropertyType.FLAT, 10000, 360, 1, 1, true,
                    "SR Nagar Main Road", "SR Nagar", "Ameerpet Metro", "Ameerpet", "Hyderabad",
                    broker2, HYDERABAD_LAT_LNG, 8),

            prop("Independent House in Kompally", "4BHK", OfferType.RENT_LONG_TERM,
                    PropertyType.HOUSE, 65000, 2800, 4, 3, true,
                    "Kompally Main Road", "Kompally", "Medchal Road", "Kompally", "Hyderabad",
                    broker2, HYDERABAD_LAT_LNG, 9),

            // ── RENT SHORT-TERM (25) ──────────────────────────────────────────
            prop("Premium Sea-View Studio for Vacation", "Studio", OfferType.RENT_SHORT_TERM,
                    PropertyType.APARTMENT, 8000, 480, 1, 1, true,
                    "Carter Road", "Bandra West", "Bandstand Promenade", "Bandra", "Mumbai",
                    broker1, MUMBAI_LAT_LNG, 11),

            prop("Cosy 1BHK for Weekend Getaway", "1BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.FLAT, 4500, 520, 1, 1, true,
                    "Hill Road", "Bandra West", "St Andrew's Church", "Bandra", "Mumbai",
                    broker1, MUMBAI_LAT_LNG, 12),

            prop("Luxury 2BHK for Short Stay", "2BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.APARTMENT, 9500, 950, 2, 2, true,
                    "Worli Sea Face", "Worli", "Worli Sea Link Entry", "Worli", "Mumbai",
                    broker1, MUMBAI_LAT_LNG, 13),

            prop("Heritage Flat near Gateway", "1BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.FLAT, 6500, 650, 1, 1, true,
                    "Apollo Bunder", "Colaba", "Taj Mahal Palace", "Colaba", "Mumbai",
                    broker1, MUMBAI_LAT_LNG, 14),

            prop("Modern Villa with Private Pool", "4BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.VILLA, 35000, 4500, 4, 4, true,
                    "Juhu Tara Road", "Juhu", "Juhu Beach", "Juhu", "Mumbai",
                    broker1, MUMBAI_LAT_LNG, 15),

            prop("Diplomatic Enclave Suite", "2BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.APARTMENT, 12000, 1100, 2, 2, true,
                    "Chanakyapuri", "Chanakyapuri", "Rashtrapati Bhavan", "Central Delhi", "Delhi",
                    broker2, DELHI_LAT_LNG, 10),

            prop("Boutique Studio in Hauz Khas", "Studio", OfferType.RENT_SHORT_TERM,
                    PropertyType.APARTMENT, 5500, 420, 1, 1, true,
                    "Hauz Khas Village", "Hauz Khas", "Deer Park", "South Delhi", "Delhi",
                    broker2, DELHI_LAT_LNG, 11),

            prop("Heritage Haveli Stay", "3BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.HOUSE, 15000, 2200, 3, 3, true,
                    "Old Delhi Road", "Chandni Chowk", "Red Fort", "Old Delhi", "Delhi",
                    broker2, DELHI_LAT_LNG, 12),

            prop("Contemporary Flat near AIIMS", "1BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.FLAT, 4000, 480, 1, 1, true,
                    "Ansari Nagar", "Safdarjung", "AIIMS Metro", "South Delhi", "Delhi",
                    broker2, DELHI_LAT_LNG, 13),

            prop("Penthouse with City View", "3BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.APARTMENT, 22000, 2000, 3, 3, true,
                    "DLF Avenue", "Saket", "Select CityWalk", "South Delhi", "Delhi",
                    broker2, DELHI_LAT_LNG, 14),

            prop("Serviced 1BHK near MG Road", "1BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.APARTMENT, 4200, 520, 1, 1, true,
                    "Brigade Road", "MG Road", "Trinity Circle Metro", "Central Bengaluru", "Bengaluru",
                    broker3, BENGALURU_LAT_LNG, 10),

            prop("Cosy Studio in Koramangala", "Studio", OfferType.RENT_SHORT_TERM,
                    PropertyType.FLAT, 3500, 380, 1, 1, true,
                    "3rd Block", "Koramangala", "Spar Hypermarket", "Koramangala", "Bengaluru",
                    broker3, BENGALURU_LAT_LNG, 11),

            prop("Lake View Villa in Whitefield", "3BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.VILLA, 18000, 3200, 3, 3, true,
                    "Varthur Lake Road", "Whitefield", "Varthur Lake", "Whitefield", "Bengaluru",
                    broker3, BENGALURU_LAT_LNG, 12),

            prop("Tech-Park Proximity 2BHK", "2BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.APARTMENT, 6000, 900, 2, 2, true,
                    "Sarjapur Road", "Bellandur", "Embassy Tech Village", "Bellandur", "Bengaluru",
                    broker3, BENGALURU_LAT_LNG, 13),

            prop("Bohemian Loft in Indiranagar", "Studio", OfferType.RENT_SHORT_TERM,
                    PropertyType.FLAT, 4800, 450, 1, 1, true,
                    "12th Main Road", "Indiranagar", "Toit Brewpub", "Indiranagar", "Bengaluru",
                    broker3, BENGALURU_LAT_LNG, 14),

            prop("Hillside Retreat Villa", "4BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.VILLA, 28000, 4000, 4, 4, true,
                    "Koregaon Park Road", "Koregaon Park", "Osho Ashram", "Koregaon Park", "Pune",
                    broker1, PUNE_LAT_LNG, 7),

            prop("Furnished 2BHK near Pune University", "2BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.APARTMENT, 7500, 880, 2, 2, true,
                    "Senapati Bapat Marg", "Deccan", "Pune University", "Deccan", "Pune",
                    broker1, PUNE_LAT_LNG, 8),

            prop("Budget Studio in Kharadi", "Studio", OfferType.RENT_SHORT_TERM,
                    PropertyType.FLAT, 2800, 370, 1, 1, true,
                    "EON IT Park Road", "Kharadi", "World Trade Center", "Kharadi", "Pune",
                    broker1, PUNE_LAT_LNG, 9),

            prop("Upscale 1BHK in Camp", "1BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.APARTMENT, 5500, 590, 1, 1, true,
                    "MG Road", "Camp", "Jehangir Hospital", "Camp", "Pune",
                    broker2, PUNE_LAT_LNG, 7),

            prop("Boutique House in Kalyani Nagar", "3BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.HOUSE, 14000, 2000, 3, 2, true,
                    "Mahadji Shinde Road", "Kalyani Nagar", "Inorbit Mall", "Kalyani Nagar", "Pune",
                    broker2, PUNE_LAT_LNG, 8),

            prop("Luxury Serviced Apartment in Banjara Hills", "2BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.APARTMENT, 11000, 1050, 2, 2, true,
                    "Road No 10", "Banjara Hills", "GVK One Mall", "Banjara Hills", "Hyderabad",
                    broker2, HYDERABAD_LAT_LNG, 10),

            prop("Modern Studio in HITEC City", "Studio", OfferType.RENT_SHORT_TERM,
                    PropertyType.FLAT, 3800, 400, 1, 1, true,
                    "Cyber Pearl", "HITEC City", "Hitech City Metro", "Madhapur", "Hyderabad",
                    broker3, HYDERABAD_LAT_LNG, 10),

            prop("Heritage Bungalow in Secunderabad", "4BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.HOUSE, 20000, 3500, 4, 3, true,
                    "Trimulgherry", "Secunderabad", "Secunderabad Railway Station", "Secunderabad", "Hyderabad",
                    broker2, HYDERABAD_LAT_LNG, 11),

            prop("Cosy 1BHK near Charminar", "1BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.FLAT, 3200, 460, 1, 1, true,
                    "Laad Bazaar", "Charminar", "Charminar Monument", "Old City", "Hyderabad",
                    broker3, HYDERABAD_LAT_LNG, 12),

            prop("Golf-View Penthouse", "3BHK", OfferType.RENT_SHORT_TERM,
                    PropertyType.APARTMENT, 25000, 2200, 3, 3, true,
                    "Khajaguda", "Narsingi", "Golconda Fort View", "Narsingi", "Hyderabad",
                    broker3, HYDERABAD_LAT_LNG, 13)
        );

        List<Property> saved = propertyRepository.saveAll(props);
        log.info("DataInitializer: saved {} properties.", saved.size());

        // ── 4. Images ──────────────────────────────────────────────────────────
        for (int i = 0; i < saved.size(); i++) {
            Property p = saved.get(i);
            int imgCount = (i % 3 == 0) ? 2 : 3; // alternates 2 or 3 images
            for (int d = 1; d <= imgCount; d++) {
                PropertyImage img = new PropertyImage();
                img.setProperty(p);
                img.setImageUrl("https://picsum.photos/seed/hah" + i + "img" + d + "/800/600");
                img.setDisplayOrder(d);
                propertyImageRepository.save(img);
            }
        }
        log.info("DataInitializer: images saved.");

        // ── 5. Amenities ───────────────────────────────────────────────────────
        String[][] mumbaiAmenities = {
            {"Lilavati Hospital",            "A-791, Bandra Reclamation, Bandra West, Mumbai"},
            {"Ryan International School",    "LBS Marg, Kurla West, Mumbai"},
            {"Nanavati Super Speciality Hospital", "S.V. Road, Vile Parle West, Mumbai"},
            {"Bombay Scottish School",       "Mahim, Mumbai"},
        };
        String[][] delhiAmenities = {
            {"AIIMS Hospital",               "Ansari Nagar East, New Delhi"},
            {"Delhi Public School RK Puram", "Sector 12, R.K. Puram, New Delhi"},
            {"Safdarjung Hospital",          "Sri Aurobindo Marg, New Delhi"},
            {"Kendriya Vidyalaya Andrews Ganj", "Andrews Ganj, New Delhi"},
        };
        String[][] bengaluruAmenities = {
            {"Manipal Hospital",             "98, HAL Airport Road, Bengaluru"},
            {"National Public School",       "HSR Layout Sector 4, Bengaluru"},
            {"Fortis Hospital",              "154/9, Bannerghatta Road, Bengaluru"},
            {"Delhi Public School Bengaluru","Mysore Road, Bengaluru"},
        };
        String[][] puneAmenities = {
            {"Ruby Hall Clinic",             "40, Sassoon Road, Pune"},
            {"The Orchid School",            "NIBM Road, Kondhwa Khurd, Pune"},
            {"Jehangir Hospital",            "32, Sassoon Road, Pune"},
            {"Symbiosis School",             "Viman Nagar, Pune"},
        };
        String[][] hyderabadAmenities = {
            {"Yashoda Hospital",             "Rajbhavan Road, Somajiguda, Hyderabad"},
            {"Oakridge International School","Bachupally, Hyderabad"},
            {"Apollo Hospital",             "Jummeraat Bazaar, Hyderabad"},
            {"Chirec Public School",         "Kondapur, Hyderabad"},
        };

        for (int i = 0; i < saved.size(); i++) {
            Property p       = saved.get(i);
            String city      = p.getCity();
            String[][] pool  = cityAmenityPool(city, mumbaiAmenities, delhiAmenities,
                                               bengaluruAmenities, puneAmenities, hyderabadAmenities);

            // Hospital
            NearbyAmenity hospital = new NearbyAmenity();
            hospital.setType(AmenityType.HOSPITAL);
            hospital.setName(pool[i % 2 == 0 ? 0 : 2][0]);
            hospital.setAddress(pool[i % 2 == 0 ? 0 : 2][1]);
            hospital.setDistanceKm(round(0.3 + (i % 7) * 0.1));
            hospital.setAutoFetched(false);
            hospital.setProperty(p);
            nearbyAmenityRepository.save(hospital);

            // School
            NearbyAmenity school = new NearbyAmenity();
            school.setType(AmenityType.SCHOOL);
            school.setName(pool[i % 2 == 0 ? 1 : 3][0]);
            school.setAddress(pool[i % 2 == 0 ? 1 : 3][1]);
            school.setDistanceKm(round(0.5 + (i % 5) * 0.1));
            school.setAutoFetched(false);
            school.setProperty(p);
            nearbyAmenityRepository.save(school);
        }
        log.info("DataInitializer: amenities saved.");

        // ── 6. Closed Deals ────────────────────────────────────────────────────
        // Take first 5 SELL properties → CLOSED → SOLD
        List<Property> sellProps = saved.stream()
                .filter(p -> p.getOfferType() == OfferType.SELL)
                .limit(5)
                .toList();

        for (int i = 0; i < sellProps.size(); i++) {
            Property p   = sellProps.get(i);
            Customer c   = customers[i % customers.length];

            Deal deal = new Deal();
            deal.setProperty(p);
            deal.setCustomer(c);
            deal.setDealCost(p.getOfferCost());
            deal.setStatus(DealStatus.CLOSED);
            dealRepository.save(deal);

            p.setStatus(PropertyStatus.SOLD);
            p.setOwner(c);
            propertyRepository.save(p);
        }

        // Take first 5 RENT_LONG_TERM properties → CLOSED → RENTED
        List<Property> rentProps = saved.stream()
                .filter(p -> p.getOfferType() == OfferType.RENT_LONG_TERM)
                .limit(5)
                .toList();

        LocalDate today      = LocalDate.now();
        LocalDate sixMonthsAgo = today.minusMonths(6);

        for (int i = 0; i < rentProps.size(); i++) {
            Property p  = rentProps.get(i);
            Customer c  = customers[(i + 2) % customers.length]; // offset to vary customer

            Deal deal = new Deal();
            deal.setProperty(p);
            deal.setCustomer(c);
            deal.setDealCost(p.getOfferCost());
            deal.setStatus(DealStatus.CLOSED);
            deal.setStartDate(sixMonthsAgo);
            deal.setEndDate(today);
            dealRepository.save(deal);

            p.setStatus(PropertyStatus.RENTED);
            p.setOwner(c);
            propertyRepository.save(p);
        }

        log.info("DataInitializer: 10 closed deals created (5 SOLD, 5 RENTED).");
        log.info("DataInitializer: seeding complete ✓");
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private Broker createBroker(String name, String email, String mobile, String city) {
        Broker b = new Broker();
        b.setBroName(name);
        b.setEmail(email);
        b.setPassword(passwordEncoder.encode("Seed@1234"));
        b.setMobile(mobile);
        b.setCity(city);
        b.setRole(RoleType.BROKER);
        b.setActive(true);
        b.setPremiumEnabled(false);
        return brokerRepository.save(b);
    }

    private Customer createCustomer(String name, String email, String mobile, String city) {
        Customer c = new Customer();
        c.setCustName(name);
        c.setEmail(email);
        c.setPassword(passwordEncoder.encode("Seed@1234"));
        c.setMobile(mobile);
        c.setCity(city);
        c.setRole(RoleType.CUSTOMER);
        c.setActive(true);
        c.setPremiumEnabled(false);
        return customerRepository.save(c);
    }

    private Property prop(String title, String config, OfferType offerType,
                          PropertyType propType, double cost, double sqft,
                          int beds, int baths, boolean furnished,
                          String street, String area, String landmark, String locality, String city,
                          Broker broker, double[] cityLatLng, int offset) {

        Property p = new Property();
        p.setTitle(title);
        p.setConfiguration(config);
        p.setOfferType(offerType);
        p.setPropertyType(propType);
        p.setOfferCost(cost);
        p.setAreaSqft(sqft);
        p.setAreaUnit("sqft");
        p.setBedrooms(beds);
        p.setBathrooms(baths);
        p.setFurnished(furnished);
        p.setStreetName(street);
        p.setAreaName(area);
        p.setLandmark(landmark);
        p.setLocality(locality);
        p.setCity(city);
        p.setBroker(broker);
        p.setStatus(PropertyStatus.AVAILABLE);
        p.setDeleted(false);
        p.setViewCount(offset * 7); // realistic, varied view counts

        // Slight per-property coordinate offset so map pins don't all stack
        p.setLatitude(cityLatLng[0]  + (offset * 0.003));
        p.setLongitude(cityLatLng[1] + (offset * 0.003));

        return p;
    }

    private String[][] cityAmenityPool(String city,
            String[][] mumbai, String[][] delhi,
            String[][] bengaluru, String[][] pune, String[][] hyderabad) {
        return switch (city) {
            case "Mumbai"    -> mumbai;
            case "Delhi"     -> delhi;
            case "Bengaluru" -> bengaluru;
            case "Pune"      -> pune;
            default          -> hyderabad;
        };
    }

    private double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
