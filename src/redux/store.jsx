// src/redux/store.js
import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { authReducer } from './reducers/authReducer';

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  // Add other reducers here as needed
});

// Create store with middleware
const store = createStore(
  rootReducer,
  applyMiddleware(thunk)
);

export default store;