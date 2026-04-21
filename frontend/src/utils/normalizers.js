export const normalizeProperty = (property) => {
    if (!property) {
        return null;
    }

    const offerType = property.listingType || property.offerType || null;

    return {
        ...property,
        id: property.id || property.propId,
        price: property.price ?? property.offerCost ?? 0,
        listingType: offerType,
        offerType,
        area: property.area ?? property.areaSqft ?? 0,
        areaUnit: property.areaUnit || 'SQ_FT',
        streetName: property.streetName || '',
        areaName: property.areaName || '',
        landmark: property.landmark || '',
        locality: property.locality || property.city || '',
        city: property.city || '',
        address: property.streetName || '',
        description: property.description || property.configuration || 'No additional description is available for this listing.',
        configuration: property.configuration || '',
        imageUrls: Array.isArray(property.imageUrls) ? property.imageUrls : [],
        imageUrl: (Array.isArray(property.imageUrls) && property.imageUrls.length > 0)
            ? property.imageUrls[0]
            : (property.imageUrl || null),
        ownerName: property.ownerName || 'Customer Submission',
        createdAt: property.createdAt || null,
        latitude: property.latitude ?? null,
        longitude: property.longitude ?? null,
    };
};

export const normalizeDeal = (deal) => {
    if (!deal) {
        return null;
    }

    return {
        ...deal,
        id: deal.id || deal.dealId,
        amount: deal.dealCost ?? 0,
        transactionDate: deal.dealDate || null,
        status: deal.status || 'CLOSED',
        startDate: deal.startDate || null,
        endDate: deal.endDate || null,
    };
};

export const normalizeUserProfile = (profile) => {
    if (!profile) {
        return null;
    }

    return {
        ...profile,
        phone: profile.phone || profile.mobile || '',
        properties: Array.isArray(profile.properties)
            ? profile.properties.map(normalizeProperty)
            : []
    };
};

/**
 * Normalizes a Spring Page<T> response OR a plain Array into a consistent
 * { items, totalPages, totalElements, number } shape.
 *
 * Prevents silent breakage when a paginated and a non-paginated endpoint
 * are swapped — callers no longer need `response.data.content || response.data || []`
 * scattered throughout the codebase.
 */
export const parsePage = (data) => {
    if (Array.isArray(data)) {
        return {
            items: data,
            totalPages: 1,
            totalElements: data.length,
            number: 0,
        };
    }
    const items = Array.isArray(data.content) ? data.content : [];
    return {
        items,
        totalPages: data.totalPages ?? 1,
        totalElements: data.totalElements ?? items.length,
        number: data.number ?? 0,
    };
};