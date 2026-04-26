# Shamba Records

A full-stack web application for agricultural record management. The project consists of a React-based frontend and an Express.js and Node.js backend with PostgreSQL database.

## Screenshots
### Login Page
![Admin Page](shamba-records/src/assets/Screenshot%202026-04-26%20214502.png)
### Admin Page
![Admin Page](shamba-records/src/assets/Screenshot%202026-04-26%20214537.png)

### Add Agent Page
![Agent Page](shamba-records/src/assets/Screenshot%202026-04-26%20214600.png)
### Agent Page
![Agent Page](shamba-records/src/assets/Screenshot%202026-04-26%20214637.png)
### Add Field Page
![Agent Page](shamba-records/src/assets/Screenshot%202026-04-26%20214656.png)
### Action Page
![Agent Page](shamba-records/src/assets/Screenshot%202026-04-26%20214724.png)
## Project Structure

```
project/
├── api/                          # Backend Express server
│   ├── db.js                     # PostgreSQL connection setup
│   ├── server.js                 # Express server and API routes
│   └── package.json              # Backend dependencies
├── shamba-records/               # Frontend React app
│   ├── src/                      # Source files
│   │   ├── App.jsx               # Main app component
│   │   ├── App.css               # App styles
│   │   ├── main.jsx              # Entry point
│   │   ├── index.css             # Global styles
│   │   └── assets/               # Static assets
│   ├── public/                   # Public assets
│   ├── vite.config.js            # Vite configuration
│   ├── eslint.config.js          # ESLint configuration
│   └── package.json              # Frontend dependencies
└── README.md                     # This file
```

## Prerequisites

Make sure you have the following installed on your system:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/)
- **Deployed project link**  - [Click](https://project-eight-drab-17.vercel.app/)

## Demo Credentials:
```
Admin: admin@farm.com
Pass:  password123

Agent1: agent@farm.com
Pass:   password123

Agent2: agentii@farm.com
Pass:   password123
```
## Installation

### 1. Clone/Navigate to the Project

```bash
cd project
```

### 2. Backend Setup

Navigate to the API directory and install dependencies:

```bash
cd api
npm install
```

#### Configure Database Connection

Edit `api/db.js` to set your PostgreSQL credentials:

```javascript
const pool = new Pool({
  user: 'your_pg_user',
  password: 'your_pg_password',
  host: 'localhost',
  port: 5432,
  database: 'shamba_records'
});
```

#### Create the Database and Tables

Connect to PostgreSQL and create the database:

```sql
CREATE DATABASE crop_db;
```

Create the required tables (run in the database):

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('ADMIN', 'AGENT'))
);

-- Fields Table
CREATE TABLE fields (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    crop_type VARCHAR(50),
    planting_date DATE NOT NULL,
    current_stage VARCHAR(20) DEFAULT 'Planted', -- Planted, Growing, Ready, Harvested
    agent_id INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Observations Table
CREATE TABLE observations (
    id SERIAL PRIMARY KEY,
    field_id INTEGER REFERENCES fields(id) ON DELETE CASCADE,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Create an Admin and an Agent
INSERT INTO users (name, email, password_hash, role) VALUES 
('Alice Coordinator', 'admin@farm.com', 'password123', 'ADMIN'),
('Bob Fieldman', 'agent@farm.com', 'password123', 'AGENT');

-- Create Fields (Assigned to Bob/Agent ID 2)
INSERT INTO fields (name, crop_type, planting_date, current_stage, agent_id) VALUES 
('North Valley', 'Corn', '2026-03-01', 'Growing', 2),
('East Creek', 'Soybeans', '2026-04-20', 'Planted', 2),
('Old Ridge', 'Wheat', '2026-01-10', 'Ready', 2);

-- Add an initial observation
INSERT INTO observations (field_id, note) VALUES 
(1, 'Irrigation system checked, looks good.');

```

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd ../shamba-records
npm install
```

## Configuration

### Backend Configuration

- **API Port**: Default is `5000` (configure in `api/server.js`)
- **Secret Key**: Change `SECRET` variable in `api/server.js` for production
- **CORS**: Currently configured to accept requests from all origins

### Frontend Configuration

- **API URL**: Configure the base URL for API requests in your Axios calls (typically `http://localhost:5000`)
- **Vite Config**: Check `shamba-records/vite.config.js` for build and dev server settings

## Running the Project

### Development

Open two terminal windows:

**Terminal 1 - Backend API:**

```bash
cd api
npm start
# or if start script is not defined:
node server.js
```

The backend will run on `http://localhost:5000`

**Terminal 2 - Frontend:**

```bash
cd shamba-records
npm run dev
```

The frontend will run on `http://localhost:5173` (or another available port)

### Production Build

Build the frontend for production:

```bash
cd shamba-records
npm run build
```

## Available Scripts

### Frontend (`shamba-records/`)

- `npm run dev` - Start the development server with HMR
- `npm run build` - Build the project for production
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview the production build locally

### Backend (`api/`)

- `node server.js` - Start the Express server

## Technologies Used

### Backend
- **Express.js** (v5.2.1) - Web framework
- **PostgreSQL** - Relational database
- **JWT** (jsonwebtoken) - Authentication
- **CORS** - Cross-Origin Resource Sharing
- **pg** - PostgreSQL client

### Frontend
- **React** (v19.2.5) - UI library
- **Vite** (v8.0.10) - Build tool
- **React DOM** - React rendering library
- **Tailwind CSS** (v4.2.4) - Styling framework
- **Axios** (v1.15.2) - HTTP client
- **Lucide React** (v1.9.0) - Icon library
- **ESLint** - Code linting

## API Endpoints

### Authentication
- `POST /api/login` - User login
  - **Request**: `{ email, password }`
  - **Response**: `{ token, role, name }`

## Development Tips

1. **Hot Module Replacement (HMR)**: The frontend supports HMR during development. Changes to React components will reflect immediately in the browser.

2. **CORS Issues**: If experiencing CORS issues, verify that the backend's CORS settings allow requests from your frontend URL.

3. **Database Debugging**: Use PostgreSQL client tools like pgAdmin or psql to debug database issues.

4. **Environment Variables**: Consider creating a `.env` file for sensitive credentials (add to `.gitignore`).

## Troubleshooting

### Backend won't start
- Verify PostgreSQL is running
- Check database credentials in `api/db.js`
- Ensure port 5000 is not already in use

### Frontend won't start
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version`

### CORS errors
- Ensure backend is running on the expected port
- Check API base URL in frontend Axios configuration

## Next Steps

1. Implement additional API endpoints in `api/server.js`
2. Build UI components in `shamba-records/src/`
3. Add more database tables as needed
4. Implement user authentication flow in the frontend
5. Add environment variables for configuration

## License

Add your license information here.

## Support

For issues or questions, please open an issue in the project repository.
