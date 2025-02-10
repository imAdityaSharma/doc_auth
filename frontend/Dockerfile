# Use an official Node.js image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json before installing dependencies
COPY package*.json /app/

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . /app/

# Expose the React development port
EXPOSE 3000

# Start the React application
CMD ["npm", "start"]
