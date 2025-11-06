# Providers Extractor

Extract identity and service providers from MongoDB and sync them to Grist tables.

## Setup

```bash
npm install
cp .env.example .env
```

## Usage

Build and run the extraction script:

```bash
npm run build
npm run script:extract-providers
```

## What it does

1. Connects to MongoDB and extracts identity providers and service providers
2. Compares extracted data with existing Grist records
3. Updates Grist tables if changes are detected
4. Logs all changes and new providers
