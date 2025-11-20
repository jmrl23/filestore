# Filestore Service

This is a simple and flexible filestore service built with Fastify. It allows you to upload, list, and delete files using different storage providers.

## Features

- **File Uploads**: Upload files to a specified storage provider.
- **File Listing**: List all uploaded files with optional filtering.
- **File Deletion**: Delete files by their ID.
- **Multiple Storage Providers**: Supports both Google Cloud Storage and ImageKit.

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

1.  **Run the development server:**

    ```bash
    yarn start:dev
    ```

The server will start on the port specified in your `.env` file, and you can access the Swagger documentation at `http://localhost:<PORT>/docs`.
