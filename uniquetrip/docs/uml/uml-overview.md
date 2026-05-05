# UniqueTrip (MakeMyTrip Clone) — UML Diagrams

This document captures the system architecture, core data model, and key interaction flows using Mermaid UML.

## System Architecture

```mermaid
graph LR
  subgraph Client [Web Client]
    UI[HTML/CSS Pages<br/>index_new.html<br/>flights_new.html<br/>booking.html<br/>my-bookings.html]
    JS[script.js<br/>booking.js<br/>my-bookings.js]
  end

  subgraph Server [Node.js/Express Backend]
    API[REST APIs<br/>/auth/*<br/>/flights/*<br/>/bookings/*<br/>/health]
    Auth[Auth & Security<br/>JWT, bcrypt, rate-limit]
  end

  DB[(MySQL Database)]

  UI --> JS
  JS <-->|fetch| API
  API --> Auth
  API <-->|SQL| DB
```

If the diagram doesn't render in your preview, see the rendered image:

![Architecture](./out/architecture.png)

## Data Model (Logical)

```mermaid
classDiagram
  class users {
    +int id
    +varchar name
    +varchar email
    +varchar password
    +timestamp created_at
  }

  class flights {
    +int id
    +varchar from_city
    +varchar to_city
    +varchar airline
    +varchar flight_no
    +varchar departure
    +varchar arrival
    +varchar duration
    +int price
    +varchar stops
    +date travel_date
  }

  class bookings {
    +int id
    +varchar booking_reference
    +int flight_id
    +varchar service_type
    +int service_id
    +varchar service_name
    +varchar passenger_name
    +varchar passenger_email
    +varchar passenger_phone
    +int num_passengers
    +int total_price
    +varchar status
    +timestamp booked_at
  }

  class hotels {
    +int id
    +varchar name
    +varchar city
    +int rating
    +int price_per_night
    +text amenities
    +varchar image_url
    +date available_from
  }

  class trains {
    +int id
    +varchar from_city
    +varchar to_city
    +varchar train_name
    +varchar train_no
    +varchar departure
    +varchar arrival
    +varchar duration
    +int price
    +varchar class
    +date travel_date
  }

  class buses {
    +int id
    +varchar from_city
    +varchar to_city
    +varchar bus_operator
    +varchar bus_type
    +varchar departure
    +varchar arrival
    +varchar duration
    +int price
    +int seats_available
    +date travel_date
  }

  class cabs {
    +int id
    +varchar from_location
    +varchar to_location
    +varchar cab_type
    +int price
    +varchar duration
    +varchar distance
    +date available_date
  }

  class holidays {
    +int id
    +varchar package_name
    +varchar from_city
    +varchar destination
    +int duration_days
    +int price
    +text inclusions
    +date departure_date
  }

  bookings --> flights : optional (flight_id)
```

If the diagram doesn't render in your preview, see the rendered image:

![Data Model](./out/data-model.png)

Notes:
- `bookings` supports both flight and non-flight services using `service_type`, `service_id`, and `service_name`. `flight_id` is used for flight bookings and may be null for others.

## Authentication Flow (Sequence)

```mermaid
sequenceDiagram
  autonumber
  participant U as User (Browser)
  participant JS as script.js
  participant API as Express /api/auth
  participant DB as MySQL

  U->>JS: Submit login (email, password)
  JS->>API: POST /api/auth/login
  API->>DB: SELECT user by email
  DB-->>API: user row (hashed password)
  API->>API: bcrypt.compare
  alt valid credentials
    API-->>JS: 200 { token, user }
    JS->>U: Store token (localStorage) & redirect
  else invalid
    API-->>JS: 401 { error }
    JS->>U: Show error notification
  end
```

If the diagram doesn't render in your preview, see the rendered image:

![Auth Sequence](./out/auth-sequence.png)

## Booking Flow — Flight

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant JS as script.js
  participant BK as booking.js
  participant API as Express /api
  participant DB as MySQL

  U->>JS: Click Book (flight)
  JS->>U: Redirect booking.html?flightId=...
  U->>BK: Page load (booking.html)
  BK->>API: GET /api/flights/:id
  API->>DB: SELECT flight
  DB-->>API: flight data
  API-->>BK: 200 flight JSON
  BK->>U: Show flight summary
  U->>BK: Enter passenger + pay
  BK->>API: POST /api/bookings { flightId, ... }
  API->>DB: INSERT bookings
  DB-->>API: OK (id, ref)
  API-->>BK: 200 { booking }
  BK->>U: Confirmation (booking ref)
```

If the diagram doesn't render in your preview, see the rendered image:

![Booking Flight Sequence](./out/booking-flight-sequence.png)

## Booking Flow — Generic Service (Hotels/Holidays/Trains/Buses/Cabs)

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant JS as script.js
  participant BK as booking.js
  participant API as Express /api
  participant DB as MySQL

  U->>JS: Click Book Now (homepage card)
  JS->>U: Redirect booking.html?serviceType=holiday&id=...&name=...&price=...
  U->>BK: Page load (booking.html)
  BK->>U: Show service summary (from URL params)
  U->>BK: Enter passenger + pay
  BK->>API: POST /api/bookings { serviceType, serviceId, serviceName, ... }
  API->>DB: INSERT bookings
  DB-->>API: OK (id, ref)
  API-->>BK: 200 { booking }
  BK->>U: Confirmation (booking ref)
```

If the diagram doesn't render in your preview, see the rendered image:

![Booking Generic Sequence](./out/booking-generic-sequence.png)

## Security Components

```mermaid
graph TB
  subgraph Security
    JWT[JWT Tokens<br/>2h expiry]
    BCRYPT[bcrypt<br/>10 salt rounds]
    RL[express-rate-limit<br/>100/15m general<br/>5/15m auth]
  end

  API[Express API] --> JWT
  API --> BCRYPT
  API --> RL
```

If the diagram doesn't render in your preview, see the rendered image:

![Security](./out/security.png)

---

Quick view: Open this file in VS Code with Mermaid preview support, or copy diagrams into any Mermaid-compatible viewer.
