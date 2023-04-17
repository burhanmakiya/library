Book Management API
This is a simple book management API built with Node.js, Express, and MongoDB. The API allows you to manage books, exemplars (book copies), users, and book rentals.

Installation
Clone the repository:
bash
Copy code
git clone <repository-url>
Install the dependencies:
Copy code
npm install
Start the server:
sql
Copy code
npm start
The server will be listening on port 3000.

API Endpoints
Books
GET /books: Retrieve a list of books.
POST /books: Add a new book.
DELETE /book/:id: Remove a book by ID.
PUT /book/:id: Update a book by ID.
Exemplars
POST /exemplar: Add a new exemplar.
GET /exemplar: Retrieve a list of exemplars.
DELETE /exemplar/:id: Remove an exemplar by ID.
Rent
POST /rent: Add a new rent.
GET /rent: Retrieve a list of rents.
POST /rent/end: End a rent by rent ID.
Users
POST /user: Add a new user.
GET /user: Retrieve a list of users.
Usage
You can use any API client, like Postman or Insomnia, to interact with the endpoints. Make sure to set the Content-Type header to application/json when sending requests with a JSON payload.
