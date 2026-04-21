# Seed Credentials (Dev Only)

These accounts are created by `DataInitializer.java` when the backend starts under the `dev` profile.
All accounts use the same password: **`Seed@1234`**

---

## Brokers

| Name           | Email                   | Password   | City       |
|----------------|-------------------------|------------|------------|
| Rajesh Sharma  | seed.broker1@hah.com    | Seed@1234  | Mumbai     |
| Priya Nair     | seed.broker2@hah.com    | Seed@1234  | Delhi      |
| Arjun Mehta    | seed.broker3@hah.com    | Seed@1234  | Bengaluru  |

## Customers

| Name            | Email                   | Password   | City       |
|-----------------|-------------------------|------------|------------|
| Ananya Iyer     | seed.cust1@hah.com      | Seed@1234  | Mumbai     |
| Karan Malhotra  | seed.cust2@hah.com      | Seed@1234  | Delhi      |
| Sneha Reddy     | seed.cust3@hah.com      | Seed@1234  | Bengaluru  |
| Vikram Patel    | seed.cust4@hah.com      | Seed@1234  | Pune       |

---

## What gets seeded

| Entity            | Count  | Notes                                              |
|-------------------|--------|----------------------------------------------------|
| Brokers           | 3      | One per primary city                               |
| Customers         | 4      | Spread across cities                               |
| Properties        | 75     | 25 SELL · 25 RENT_LONG_TERM · 25 RENT_SHORT_TERM  |
| Property Images   | ~200   | 2–3 per property via picsum.photos fixed seeds     |
| Nearby Amenities  | 150    | 1 HOSPITAL + 1 SCHOOL per property                 |
| Closed Deals      | 10     | 5 SELL→SOLD · 5 RENT_LONG_TERM→RENTED             |

---

## Notes

- Seeding is **idempotent** — guarded by checking for `seed.broker1@hah.com`. Re-starting the server will not duplicate data.
- Only runs with `--spring.profiles.active=dev` (or `SPRING_PROFILES_ACTIVE=dev`).
- Images are loaded from `https://picsum.photos/seed/hah{n}img{d}/800/600` — requires internet access.
- Closed deals update the linked property's `status` (SOLD/RENTED) and set its `owner` to the purchasing customer.
