import axios from 'axios';

const HttpClient = axios.create({
    baseURL: 'https://Localhost:5000', // Replace with your API base URL
    timeout: 1000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Example of a GET request
export const getData = async (endpoint) => {
    try {
        const response = await HttpClient.get(endpoint);
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

// Example of a POST request
export const postData = async (endpoint, data) => {
    try {
        const response = await HttpClient.post(endpoint, data);
        return response.data;
    } catch (error) {
        console.error('Error posting data:', error);
        throw error;
    }
};

export default HttpClient;