class StorageUtility {
	static isAvailable(type) {
		// Helper method to determine if both the store exists and has space
		const storage = window[type];
		try {
			const x = '__storage_test__';
			storage.setItem(x, x);
			storage.removeItem(x);
			return true;
		} catch (e) {
			return e instanceof DOMException && (
				// everything except Firefox
				e.code === 22 ||
				// Firefox
				e.code === 1014 ||
				// test name field too, because code might not be present
				// everything except Firefox
				e.name === 'QuotaExceededError' ||
				// Firefox
				e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
				// acknowledge QuotaExceededError only if there's something already stored
				storage.length !== 0;
		}
	}

	constructor(config) {
		// Initialize lastChange as when first constructed
		this.lastChange = Date.now();
		// Determine the target storage entity on the window
		this.target = window[config.target];
		// Store the desired tiers
		this.sortedTiers = config.tiers.sort((a, b) => {
			if (a.expiration < b.expiration) {
				return 1;
			}
			if (a.expiration > b.expiration) {
				return -1;
			}
			return 0;
		});
		/* Now that the tiers are sorted in increasing duration, we can
		generate the map of tier name to key. */
		this.tierMap = {};
		this.sortedTiers.forEach((tier, index) => {
			if (index === 0) {
				this.tierMap[tier.name] = {
					key: tier.name,
					expiration: tier.expiration,
				};
			} else {
				this.tierMap[tier.name] = {
					key: `${this.tierMap[this.sortedTiers[index - 1].name].key}-${tier.name}`,
					expiration: tier.expiration,
				};
			}
		});
	}

	/** Retrieves the associated data from storage */
	get(key, tier) {
		// If the desired tier doesn't exist, print a warning to the console
		if (!this.tierMap[tier]) {
			console.error(`Tier ${tier} does not exist`);
			return null;
		}

		const now = Date.now();
		const inactivity = now - this.lastChange;
		// Update lastChange
		this.lastChange = now;
		// Initiate the removal of invalid tiers
		this.invalidate(inactivity);
		// If tier is invalid, return null else retrieve
		return this.tierMap[tier].expiration > inactivity ?
			JSON.parse(this.target.getItem(`${this.tierMap[tier].key}-${key}`)) : null;
	}

	/** Puts a desired value into the target store. Returns null if unsuccessful */
	set(key, value, tier) {
		// If the desired tier doesn't exist, print a warning to the console
		if (!this.tierMap[tier]) {
			console.error(`Tier ${tier} does not exist`);
			return null;
		} else if (!this.isAvailable()) {
			return null;
		}

		const newValue = JSON.stringify(value);
		const newKey = `${this.tierMap[tier].key}-${key}`;

		const now = Date.now();
		const inactivity = now - this.lastChange;
		// Update lastChange
		this.lastChange = now;
		// Initiate the removal of invalid tiers
		this.invalidate(inactivity);

		try {
			this.target.setItem(newKey, newValue);
			// Successful set
			return true;
		} catch (e) {
			// Unsuccessful set
			console.error(e);
			return false;
		}
	}

	/** Removes the desired key from the desired tier */
	remove(key, tier) {
		if (!this.tierMap[tier]) {
			console.error(`Tier ${tier} does not exist`);
			return null;
		}

		this.target.removeItem(`${this.tierMap[tier].key}-${key}`);
		return true;
	}

	/** Removes all keys in the store */
	removeAll() {
		// Simply remove all keys that contain the heighest tier
		const filter = `${this.sortedTiers[0].name}-`;
		Object.keys(this.target).forEach((key) => {
			if (key.indexOf(filter) > -1) {
				this.target.removeItem(key);
			}
		});
	}

	invalidate(inactivity) {
		/* Based on the amount of inactivity, determine
		which tiers should be removed and remove all of
		those tiers */
		let filter = '';

		const invalid = this.sortedTiers.some((tier) => {
			if (tier.expiration > inactivity) {
				filter = filter.concat(`${tier.name}-`);
				return false;
			}
			filter = filter.concat(`${tier.name}-`);
			return true;
		});
		// If there exists a tier to invalidate, do it
		if (invalid) {
			Object.keys(this.target).forEach((key) => {
				// If filter is present, remove
				if (key.indexOf(filter) > -1) {
					this.target.removeItem(key);
				}
			});
		}
	}

	// Helper method to determine if both the store exists and has space
	isAvailable() {
		try {
			const x = '__storage_test__';
			this.target.setItem(x, x);
			this.target.removeItem(x);
			return true;
		} catch (e) {
			return e instanceof DOMException && (
				// everything except Firefox
				e.code === 22 ||
				// Firefox
				e.code === 1014 ||
				// test name field too, because code might not be present
				// everything except Firefox
				e.name === 'QuotaExceededError' ||
				// Firefox
				e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
				// acknowledge QuotaExceededError only if there's something already stored
				this.target.length !== 0;
		}
	}
}

export default StorageUtility;
