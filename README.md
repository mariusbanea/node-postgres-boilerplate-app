# Node and PostgreSQL Boilerplate app
## How to set it up
* Clone this repository to your local machine
* Install the dependencies for the project (`npm install`)
* Ensure your PostgreSQL server is running
* Create a User for this exercise
* Create a database for the exercise with your user as the owner
* Rename the `example.env` file to `.env` and update the following fields with your database credentials:
  ```
   MIGRATION_DB_NAME=
   MIGRATION_DB_USER=
   MIGRATION_DB_PASS=
   DB_URL="postgresql://USERNAME@localhost/DATABASE_NAME"
  ```
* Run the command `npm run migrate -- 1` to create the database tables
* run the command `npm t`
* You should see output from 10 integration tests, all passing.

## App Structure

* __migration__ folder contains all the sql files necesay for the DB setup
* __public__ folder contains the View related files
* __src__ folder contains the Controller related files
    * __server.js__ is the entry point of the Controller logic (where all the general app settings live)
    * __app.js__ is the starting pint for the routes

    * __todo__ folder contains the router with all the todo API endpoints
        * __todo-router.js__ Todo Router
            * GET Endpoint: Add a GET endpoint to this server
            * POST Endpoint: Add a POST endpoint to this server
            * DELETE Endpoint: Add a Delete endpoint to this server
            * PATCH Endpoint: Add a PATCH Endpoint to this server
        * __todo-service.js__ Service file for the Controller connection witht the Model
    * __middleware__ folder contains functions that are used by the controller in multiple places
* __test__ folder contains the Test files
