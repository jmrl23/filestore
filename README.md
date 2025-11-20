# Filestore Service

This is a simple and flexible filestore service built with Fastify. It allows you to upload, list, and delete files using different storage providers.

## Features

- **File Uploads**: Upload multiple files to a specified storage provider.
- **File Listing**: List all uploaded files with optional filtering and revalidation.
- **File Fetching**: Retrieve details of a specific file by its ID.
- **File Deletion**: Delete files by their ID.
- **Multiple Storage Providers**: Supports various storage providers (e.g., Google Cloud Storage, ImageKit) and allows easy implementation of custom providers.

## Getting Started

1. **Clone the repository:**

   ```bash
   git clone https://github.com/jmrl23/filestore.git
   ```

1. **Install dependencies:**

   ```bash
   yarn install
   ```

1. **Set up environment variables:**

Create a `.env` file and configure the necessary storage provider credentials.

1. **Run the development server:**

   ```bash
   yarn start:dev
   ```

The server will start on the port specified in your `.env` file, and you can access the Swagger documentation at `http://localhost:<PORT>/docs`.

## Running with Docker

1. **Build the Docker image:**

   ```bash
   docker build -t filestore-service .
   ```

1. **Run the Docker container:**

   Make sure you have your `.env` file configured with valid database and storage provider credentials.

   ```bash
   docker run -p 3001:3001 --env-file .env filestore-service
   ```
