# RecipeApp

RecipeApp is a comprehensive recipe management application built with Angular that allows users to search for recipes based on ingredients, filter recipes by various criteria, and save their favorite recipes.

## Features

### Recipe Search
- **Ingredient-Based Search**: Search for recipes by specifying at least 2 ingredients on the home page
- **Advanced Filtering**: Filter recipes by area, category, and ingredients on the dashboard page
- **Recipe Details**: View detailed recipe information including ingredients, measurements, and step-by-step instructions

### User Management
- **Authentication**: Sign up and log in using Firebase Authentication
- **Favorites**: Save and manage your favorite recipes (requires authentication)

### Data Management
- **Dual Storage Options**: Choose between Firebase or LocalStorage as your data provider
- **Offline Access**: Access your recipes even without an internet connection when using LocalStorage
- **Data Synchronization**: Sync your favorites between different storage providers

## Implementation Details

### Authentication
- Implemented using Firebase Authentication
- Secure token-based authentication with automatic token refresh
- Protected routes using Angular route guards

### Data Storage
- **API Integration**: Recipes are fetched from [TheMealDB API](https://www.themealdb.com/api.php)
- **Flexible Storage**: 
  - Firebase Realtime Database for cloud storage
  - LocalStorage for offline and browser-based storage
- **Provider Pattern**: Easily switch between storage providers in app.config.ts

### Deployment
- Deployed on both [Vercel](https://recipe-app-stefaniambibart-gmailcoms-projects.vercel.app/home) and [GitHub Pages](https://stefaniabibart.github.io/recipe_app/home)

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- Angular CLI (v18 or higher)
- Firebase account with Realtime Database and Authentication enabled

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Environment Configuration:
   - Create a `.env` file in the root directory with the following content:
   ```
   FIREBASE_AUTH_KEY=your_firebase_api_key
   ```
   - Replace `your_firebase_api_key` with your actual Firebase API key

3. Firebase Configuration:
   - Update the Firebase configuration in `src/app/app.config.ts`:
   ```typescript
   const firebaseConfig = {
     databaseURL: "your_firebase_database_url",
    };
   ```

4. Firebase Database Security Rules:
   Set up the following security rules in your Firebase Realtime Database:
   ```json
   {
     "rules": {
       "favorites": {
         "$userId": {
           // Only allow read/write if the user is authenticated and accessing their own data
           ".read": "auth != null && auth.uid == $userId",
           ".write": "auth != null && auth.uid == $userId",
           "$recipeId": {
             // Validate the data structure
             ".validate": "newData.hasChildren(['id', 'name', 'instructions', 'ingredients', 'image', 'area', 'category'])",
             "id": {
               ".validate": "newData.isString()"
             },
             "name": {
               ".validate": "newData.isString()"
             },
             "instructions": {
               ".validate": "newData.isString()"
             },
             "ingredients": {
               ".validate": "newData.hasChildren()"
             },
             "image": {
               ".validate": "newData.isString()"
             },
             "area": {
               ".validate": "newData.isString()"
             },
             "category": {
               ".validate": "newData.isString()"
             }
           }
         }
       },
       "mealdb": {
         // Allow public read/write access to mealdb data
         ".read": true,
         ".write": true
       }
     }
   }
   ```

### Running the Application
1. Start the development server:
   ```
   npm start
   ```
   This will load environment variables and start the Angular development server.

2. Navigate to `http://localhost:4200/` in your browser.

### Switching Data Providers
To change the data provider (Firebase or LocalStorage), modify the provider in `src/app/app.config.ts`:

```typescript
// Set which data provider to use
const DATA_PROVIDER = DataProviderType.FIREBASE; // For Firebase
// OR
const DATA_PROVIDER = DataProviderType.LOCALSTORAGE; // For LocalStorage
```