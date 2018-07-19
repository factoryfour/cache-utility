# storageUtility
A wrapper class around session storage to simplify a tiered frontend caching strategy. This approach was inspired by GrubHub engineering: https://bytes.grubhub.com/localstorage-design-patterns-and-passive-expiration-ffe86a539b15.

## Motivation
Frontend caching has many benefits. One of the biggest improvements it can provide is to reduce the number of requests made to the backend by storing data that rarely changes on the frontend. This reduces the time the user spends waiting for data to load on a particular page and leads to a more responsive application. The `sessionStorge` and `localStorage` properties on the browser window provide a simple API for managing this data. However, these properties only allow for management of string-based data and do not handle cache invalidation. This is where this utility comes in.

## Approach
storageUtility provides a higher-level API for working with these storage entities. It uses a tier-based approach to invalidating data in the cache. The user can specify tiers within the cache with specific expiration times. If the storage entity has been inactive for a greater amount of time than this expiration, all keys within this tier are removed from storage. This is a passive approach to managing data in the cache and reduces the processing required to manage the cache.

## Installation
Once we determine how we would like this installed, put the details here.

## How to Use
### Configuration
An instance of storageUtility receives a configuration object in its constructor. It's structure is defined below:
```javascript
{
	target, // Either 'sessionStorage' or 'localStorage' depending on the desired target
	tiers: [
		{
			name: 'Name', // Desired name for the tier, cannot include any whitespace
			expiration: 5000, // Desired expiration time in ms
		},
		...
	], 
}
```
### Methods
```javascript
import storageUtility from 'storageUtility';

const config = {
	target: 'localStorage',
	tiers:[
		{
			name: 'Tier-1',
			expiration: 3600000,
		},
		{
			name: 'Tier-2',
			expiration: 7200000,
		},
	],
};

const utility = new storageUtility(config);

/** To put values in storage, use set */
utility.set('myKey', { myValue: 1 }, 'Tier-1');

/** To retreive value from storage, use get */
const result = utility.get('myKey', 'Tier-1');
```
The storageUtility instance will manage all invalidation of keys within the store.

## Acknowledgements
We'd like to thank the engineers at GrubHub for sharing their approach to frontend caching that inspired this work.
