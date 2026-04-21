export const DEAL_STATUS = {
    PENDING: 'PENDING',
    UNDER_CONTRACT: 'UNDER_CONTRACT',
    CLOSED: 'CLOSED',
    REJECTED: 'REJECTED'
};

export const OFFER_TYPE = {
    SELL: 'SELL',
    RENT_LONG_TERM: 'RENT_LONG_TERM',
    RENT_SHORT_TERM: 'RENT_SHORT_TERM'
};

export const AREA_UNIT = {
    SQ_FT: 'SQ_FT',
    SQ_YARDS: 'SQ_YARDS'
};

export const PROPERTY_STATUS = {
    APPROVED: 'APPROVED',
    PENDING: 'PENDING',
    REJECTED: 'REJECTED',
    AVAILABLE: 'AVAILABLE',
    RENTED: 'RENTED',
    SOLD: 'SOLD',
    OFF_MARKET: 'OFF_MARKET',
    RESERVED: 'RESERVED'
};

export const PROPERTY_TYPE = {
    FLAT: 'FLAT',
    PLOT: 'PLOT',
    SHOP: 'SHOP',
    APARTMENT: 'APARTMENT',
    HOUSE: 'HOUSE',
    VILLA: 'VILLA',
    COMMERCIAL: 'COMMERCIAL'
};

export const ROLE_TYPE = {
    CUSTOMER: 'CUSTOMER',
    BROKER: 'BROKER',
    ADMIN: 'ADMIN'
};

export const formatEnumLabel = (value) => {
    if (!value) {
        return '';
    }

    return value
        .split('_')
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ');
};

export const getPropertyStatusLabel = (status) => {
    const labels = {
        AVAILABLE: 'Available',
        APPROVED: 'Approved',
        PENDING: 'Pending Review',
        REJECTED: 'Rejected',
        RESERVED: 'Reserved',
        RENTED: 'Rented',
        SOLD: 'Sold',
        OFF_MARKET: 'Off Market'
    };

    return labels[status] || formatEnumLabel(status);
};

export const getDealStatusLabel = (status) => {
    const labels = {
        PENDING: 'Pending',
        UNDER_CONTRACT: 'Under Contract',
        CLOSED: 'Closed',
        REJECTED: 'Rejected'
    };

    return labels[status] || formatEnumLabel(status);
};

export const getOfferTypeLabel = (offerType) => {
    const labels = {
        SELL: 'For Sale',
        RENT_LONG_TERM: 'Long-Term Rent',
        RENT_SHORT_TERM: 'Short-Term Rent'
    };

    return labels[offerType] || formatEnumLabel(offerType);
};

export const getOfferActionLabel = (offerType) => {
    return offerType === OFFER_TYPE.SELL ? 'Purchase' : 'Lease';
};

export const getAreaUnitLabel = (areaUnit) => {
    const labels = {
        SQ_FT: 'sq.ft',
        SQ_YARDS: 'sq.yards'
    };

    return labels[areaUnit] || formatEnumLabel(areaUnit);
};