# HelpConnect API Documentation

Version: 1.0\
Base URL (local): `http://localhost:5000`\
Format: REST API, JSON\
Authentication: JWT Bearer token for protected endpoints

> This document describes the routes currently implemented in
> HelpConnect based on the project route structure. If your code
> changes, update this document to match it.

## 1. General conventions

### Headers

For protected endpoints, send:

``` http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

For JSON requests, use `Content-Type: application/json`.

### Common responses

  HTTP status                   Meaning
  ----------------------------- -------------------------------------------
  `200 OK`                      Request succeeded
  `201 Created`                 Resource created
  `400 Bad Request`             Invalid input, ID, or workflow transition
  `401 Unauthorized`            Missing or invalid authentication token
  `403 Forbidden`               Authenticated user lacks permission
  `404 Not Found`               Resource not found
  `429 Too Many Requests`       Login rate limit reached
  `500 Internal Server Error`   Unexpected server error

### User roles

-   `affected_person`: can create assistance requests and view their own
    requests.
-   `volunteer`: can view requests assigned to them and advance their
    assigned work.
-   `admin`: can view/manage all requests, assign volunteers, manage
    alerts, and access dashboard statistics.

## 2. Authentication

### Register

`POST /api/auth/register`

Creates a user account. Public registration supports the
`affected_person` and `volunteer` roles; admin registration should be
performed through a trusted administrative process.

Example request:

``` json
{
  "name": "Test Volunteer",
  "email": "volunteer@example.com",
  "password": "ChooseAValidPassword123",
  "role": "volunteer"
}
```

A successful response returns user information and an authentication
token. The password should not be returned.

Possible responses: `201 Created` (success), `400 Bad Request` (invalid
or duplicate details), `500 Internal Server Error`.

### Login

`POST /api/auth/login`

Example request:

``` json
{
  "email": "volunteer@example.com",
  "password": "ChooseAValidPassword123"
}
```

A successful response returns a JWT and user information. Use the token
in the `Authorization` header for protected routes.

Possible responses: `200 OK` (success), `400` or `401` for invalid
credentials/input depending on the route implementation,
`429 Too Many Requests` when the login rate limit is exceeded.

## 3. Assistance requests

### Create an assistance request

`POST /api/requests`

Authentication: required. Intended for an authenticated affected person.

Example request:

``` json
{
  "requesterName": "Test User",
  "contactNumber": "9876543210",
  "assistanceType": "Food",
  "description": "Need food for a family of four",
  "location": {
    "address": "Gandhinagar, Gujarat",
    "latitude": 23.2156,
    "longitude": 72.6369
  },
  "urgency": "High"
}
```

Allowed `assistanceType` values: `Food`, `Water`, `Medical`, `Shelter`,
`Rescue`, `Clothing`, `Other`.

Allowed `urgency` values: `Low`, `Medium`, `High`, `Critical`.

The server sets `createdBy` from the authenticated user and initializes
status to `Submitted` with a status-history entry.

Success: `201 Created`. Validation failure: `400 Bad Request`.

### List requests, filter, search, and paginate

`GET /api/requests`

Authentication: required.

Query parameters:

  -----------------------------------------------------------------------
  Parameter               Required                Description
  ----------------------- ----------------------- -----------------------
  `status`                No                      Filter by request
                                                  status

  `assistanceType`        No                      Filter by assistance
                                                  category

  `search`                No                      Search requester name,
                                                  contact number, or
                                                  description

  `page`                  No                      Page number; defaults
                                                  to `1`

  `limit`                 No                      Page size; defaults to
                                                  `10`, maximum `100`
  -----------------------------------------------------------------------

Example:

``` http
GET /api/requests?search=food&status=Submitted&page=1&limit=5
```

Results are role-scoped: affected people see their own requests,
volunteers see requests assigned to them, and admins see all requests.

Successful response shape:

``` json
{
  "success": true,
  "pagination": {
    "totalRequests": 1,
    "page": 1,
    "limit": 5,
    "totalPages": 1
  },
  "count": 1,
  "requests": []
}
```

The values above are illustrative; actual results depend on database
contents.

### List nearby requests

`GET /api/requests/nearby`

Authentication: required. Roles: `volunteer`, `admin`.

Query parameters:

  -----------------------------------------------------------------------
  Parameter               Required                Description
  ----------------------- ----------------------- -----------------------
  `latitude`              Yes                     Latitude from `-90` to
                                                  `90`

  `longitude`             Yes                     Longitude from `-180`
                                                  to `180`

  `radius`                No                      Search radius in
                                                  kilometres; defaults to
                                                  `10`, maximum `100`
  -----------------------------------------------------------------------

Example:

``` http
GET /api/requests/nearby?latitude=23.2156&longitude=72.6369&radius=10
```

Returns unassigned requests in eligible statuses within the radius,
ordered by distance. Each result includes `distanceKm`.

Invalid coordinates or radius: `400 Bad Request`.

### Get one request

`GET /api/requests/:id`

Authentication: required.

Example:

``` http
GET /api/requests/REQUEST_ID
```

Affected people may only view their own request. Invalid ID: `400`;
missing request: `404`; unauthorized access: `403`.

### Assign a volunteer

`PATCH /api/requests/:id/assign`

Authentication: required. Role: `admin`.

Example request:

``` json
{
  "volunteerId": "VOLUNTEER_USER_ID"
}
```

The ID must belong to a user whose role is `volunteer`. On success, the
request is assigned and its status becomes `Assigned`.

Success: `200 OK`; invalid IDs: `400`; volunteer/request not found:
`404`; insufficient role: `403`.

### Update request status

`PATCH /api/requests/:id/status`

Authentication: required. Admins may update request status; assigned
volunteers may only advance their assigned requests from `Assigned` to
`In Progress`, then from `In Progress` to `Resolved`. Affected people
cannot update status through this endpoint.

Example request:

``` json
{
  "status": "In Progress"
}
```

Allowed statuses: `Submitted`, `Under Review`, `Verified`, `Assigned`,
`In Progress`, `Resolved`, `Cancelled`.

Each accepted change is added to `statusHistory` with the new status,
acting user, and timestamp.

Possible responses: `200 OK`, `400 Bad Request` for invalid status or
disallowed transition, `403 Forbidden`, `404 Not Found`.

## 4. Disaster alerts

### Create alert

`POST /api/alerts`

Authentication: required. Role: `admin`.

Example request:

``` json
{
  "title": "Flood Warning",
  "description": "Flooding reported in low-lying areas. Follow local emergency guidance.",
  "disasterType": "Flood",
  "severity": "High",
  "location": "Gandhinagar, Gujarat"
}
```

Allowed `disasterType` values: `Flood`, `Earthquake`, `Cyclone`, `Fire`,
`Landslide`, `Other`.

Allowed `severity` values: `Low`, `Medium`, `High`, `Critical`.

Success: `201 Created`; missing required fields or invalid values may
return `400`; insufficient role: `403`.

### List active alerts

`GET /api/alerts`

Authentication: required.

Returns active alerts, newest first.

Success: `200 OK`.

### Deactivate alert

`PATCH /api/alerts/:id/deactivate`

Authentication: required. Role: `admin`.

Deactivates an alert rather than deleting it.

Success: `200 OK`; invalid ID: `400`; alert not found: `404`;
insufficient role: `403`.

## 5. Admin dashboard

### Get dashboard statistics

`GET /api/dashboard`

Authentication: required. Role: `admin`.

Returns statistics including:

-   `totalRequests`
-   `pendingRequests` (requests with status `Submitted` or
    `Under Review`)
-   `resolvedRequests`
-   `totalVolunteers`
-   `activeAlerts`
-   `requestsByType` (counts grouped by assistance type)
-   `requestsByStatus` (counts grouped by status)

Example response shape:

``` json
{
  "success": true,
  "statistics": {
    "totalRequests": 0,
    "pendingRequests": 0,
    "resolvedRequests": 0,
    "totalVolunteers": 0,
    "activeAlerts": 0,
    "requestsByType": [],
    "requestsByStatus": []
  }
}
```

The numbers and arrays above are illustrative. Non-admin users should
receive `403 Forbidden`.

## 6. Suggested Postman environment

Create these variables in a Postman environment:

  Variable        Example
  --------------- -------------------------
  `baseUrl`       `http://localhost:5000`
  `token`         JWT returned by login
  `requestId`     ID of a created request
  `volunteerId`   ID of a volunteer user
  `alertId`       ID of a created alert

For protected requests, set Authorization to **Bearer Token** and use
`{{token}}`.

## 7. Suggested testing order

1.  Register or log in as an affected person.
2.  Create an assistance request and save its ID.
3.  Log in as admin; list requests and assign one to a volunteer.
4.  Log in as that volunteer; update status to `In Progress`, then
    `Resolved`.
5.  Log in as admin; check dashboard statistics.
6.  Create an alert, list active alerts, and deactivate the alert.
7.  Verify invalid input and unauthorized-role requests return
    appropriate errors.

## 8. Important implementation notes

-   Keep JWT secrets in environment variables; do not commit `.env` or
    real tokens.
-   Do not include real passwords or production credentials in
    documentation.
-   Keep this file synchronized with actual route code, especially exact
    validation errors and response shapes.
-   The examples use placeholder IDs and illustrative responses; replace
    them with real IDs only when testing locally.
