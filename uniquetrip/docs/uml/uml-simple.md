# UniqueTrip — Simple UML Overview

This is the shortest, easiest-to-explain version of the system diagrams. Each diagram includes a plain-language summary and a rendered image fallback.

## 1) Architecture (Big Picture)

```mermaid
graph LR
  User[User] --> UI[Web UI]
  UI --> API[Express API]
  API --> DB[(MySQL)]
```

- User uses the Web UI (HTML/CSS/JS pages)
- The UI calls the Express API
- The API reads/writes data in MySQL

Fallback image: ![Simple Architecture](./out/simple-architecture.png)

---

## 2) Data Model (Essentials Only)

```mermaid
classDiagram
  class users {
    +id: int
    +name: varchar
    +email: varchar
    +password: varchar
  }

  class flights {
    +id: int
    +from_city: varchar
    +to_city: varchar
    +flight_no: varchar
    +price: int
  }

  class bookings {
    +id: int
    +booking_reference: varchar
    +flight_id: int
    +service_type: varchar
    +service_id: int
    +service_name: varchar
    +passenger_name: varchar
    +total_price: int
  }

  bookings --> flights : may reference
```

- users: accounts with name/email/password
- flights: basic flight info with price
- bookings: records a purchase; supports flight and non-flight via service fields

Fallback image (full data model also available in detailed doc): ![Simple Data](./out/simple-data.png)

---

## 3) Booking Flow (End-to-End)

```mermaid
sequenceDiagram
  participant U as User
  participant UI as Web UI
  participant API as Express API
  participant DB as MySQL

  U->>UI: Click Book Now
  UI->>UI: Show booking details
  U->>UI: Enter passenger & pay
  UI->>API: POST /api/bookings
  API->>DB: INSERT booking
  DB-->>API: OK (id, reference)
  API-->>UI: 200 { booking }
  UI->>U: Show confirmation (ref)
```

- User starts a booking
- UI collects details and calls the API
- API stores it in the database and returns a booking reference

Fallback image: ![Simple Booking](./out/simple-booking-sequence.png)

---

For more detailed diagrams (all entities, flows, and security), see `uml-overview.md` in the same folder.
