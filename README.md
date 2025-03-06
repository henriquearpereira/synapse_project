# synapse_project
SynapSpark project

## Dependencies

### Backend
- Flask
- PyMongo
- PyJWT
- Prometheus Client
- Logging Loki

### Frontend
- React
- Axios
- use-dark-mode
- framer-motion
- react-copy-to-clipboard
- react-router-dom

## Launch Instructions

### Backend
1. Navigate to the `backend` directory.
2. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Flask application:
   ```bash
   python app.py
   ```

### Frontend
1. Navigate to the `frontend` directory.
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the React application:
   ```bash
   npm start
   ```

### Kubernetes
1. Ensure you have `kubectl` and `docker` installed and configured.
2. Apply the Kubernetes configurations:
   ```bash
   kubectl apply -f k8s/mongodb-deployment.yaml
   kubectl apply -f k8s/ollama-deployment.yaml
   kubectl apply -f k8s/backend-deployment.yaml
   kubectl apply -f k8s/frontend-deployment.yaml
   kubectl apply -f k8s/prometheus-deployment.yaml
   kubectl apply -f k8s/grafana-deployment.yaml
   kubectl apply -f k8s/loki-deployment.yaml
   ```
