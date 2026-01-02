# GraphMap: WDN simulator

## Project Purpose

GraphMap is an interactive web-based mapping system designed to visualize, create, and manage graph-based networks on a real-world map. The system allows users to place nodes (such as junctions, pumps, reservoirs, or clusters) and connect them using edges to represent relationships like pipelines or routes.

This project is primarily intended for:
- Network visualization and analysis  
- Infrastructure planning (e.g., water distribution systems)  
- Educational use in graph theory and spatial analysis  

By integrating graph theory concepts with geographic mapping, the system helps users analyze connectivity, efficiency, and structure in real-world networks.

---

## Technologies Used

### Frontend
- **React.js** – User interface and state management  
- **React Leaflet** – Interactive map rendering  
- **Leaflet.js** – Core mapping library  
- **Tailwind CSS** – UI styling  

### Backend
- **Node.js** – Server-side runtime  
- **Express.js** – API and routing  
- **PHP** – Backend data handling  
- **MySQL** – Graph data storage  

### Development & Environment
- **XAMPP** – Local server and database management  
- **REST API** – Communication between frontend and backend  

---

## Proponents

### Project Leader
- **Aaron Andrew L. Cid**

### Members
- **Celein M. Laniohan**  
- **Teotee Mae B. Secuya**  

---

## Block Diagram (System Overview)


### System Flow Explanation
1. The **user** interacts with the map interface through a web browser.  
2. The **React frontend** handles graph creation, editing, and visualization.  
3. Graph data is sent to the backend via **REST API calls**.  
4. The **backend** processes requests and communicates with the database.  
5. **MySQL** stores and retrieves graph data for saving and loading operations.  

---

## Notes
- The system supports both **directed and undirected graphs**.
- Graphs can be saved, loaded, edited, and deleted dynamically.
- Designed with scalability and extensibility in mind.


---

## Deployment

This section explains how to run the GraphMap system locally for development and testing purposes.

---

### Prerequisites

Make sure the following are installed on your system:

* **Node.js** (v16 or higher recommended)
* **npm**
* **XAMPP** (Apache & MySQL enabled)
* **Git**
* A modern web browser (Chrome, Edge, or Firefox)

---

### Backend Setup (PHP + MySQL)

1. Open **XAMPP Control Panel**

2. Start **Apache** and **MySQL**

3. Create a new database:

   * Open **phpMyAdmin**
   * Create a database (e.g., `graphmap_db`)

4. Import the database schema:

   * Import the provided `.sql` file
     *(or manually create tables for `graphs`, `graph_nodes`, and `graph_edges`)*

5. Place backend files:

   ```
   xampp/htdocs/graphmap
   ```

6. Configure database connection:

   ```php
   $host = "localhost";
   $user = "root";
   $password = "";
   $database = "graphmap_db";
   ```

---

### Frontend Setup (React)

1. Navigate to the frontend directory:

   
   cd frontend
   

2. Install dependencies:

   
   npm install
   

3. Start the development server:

   
   npm start
   

4. Open the app in your browser:

   
   http://localhost:3000
   

---

### Environment Configuration

Ensure the frontend API base URL matches the backend service:

```js
const API_BASE_URL = "http://localhost/graphmap/api";
```

or

```js
const API_BASE_URL = "http://localhost:5000/api";
```

---


