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
		// Determine the target storage entity on the window
		this.target = window[config.target];

		// Store the desired tiers from longest to shortest expiration
		this.sortedTiers = config.tiers
			.filter((tier) => {
				// We don't want any tiers with white space in the name
				if (tier.name.match(/\s/g)) {
					console.error(`Invalid tier name "${tier.name}" with whitespace`);
					return false;
				}
				return true;
			})
			.sort((a, b) => {
				if (a.expiration < b.expiration) {
					return 1;
				}
				if (a.expiration > b.expiration) {
					return -1;
				}
				return 0;
			});
		/* Now that the tiers are sorted in decreasing expiration, we can
		generate the map of tier name to key. This key is a concatendated list
		of all of the tier names that precede the current tier. This allows us
		to filter all tiers that should expire given a particular amount of inactivity */
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

		if (this.isAvailable()) {
			// Invalidate based on existing last-change
			this.invalidate();
		}
	}

	/** Retrieves the associated data from storage */
	get(key, tier) {
		// If the desired tier doesn't exist, print a warning to the console
		if (!this.tierMap[tier]) {
			console.error(`Tier ${tier} does not exist`);
			return null;
		}


		// Initiate the removal of invalid tiers
		const inactivity = this.invalidate();
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

		// Initiate the removal of invalid tiers
		this.invalidate();

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

		// Initiate the removal of invalid tiers
		this.invalidate();

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
		// Manually reset last-change
		const now = Date.now();
		this.target.setItem('last-change', JSON.stringify(now));
	}

	invalidate() {
		// Determine the amount of inactivity
		const now = Date.now();
		const lastChange = JSON.parse(this.target.getItem('last-change'));
		let inactivity = null;
		if (lastChange) {
			inactivity = now - lastChange;
			/* Based on the amount of inactivity, determine
			which tiers should be removed and remove all of
			those tiers */
			let filter = '';

			/* Here, we generate the filter string, which is a concatenation
			of tier names starting from the longest to the first tier that will
			expire given the amount of inactivity. If the tiers are sorted C,B,A from longest
			to shortest duration and we expect tiers B and A to expire, the filter will be
			C-B- because only keys within Tiers B and A will include this substring. */
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
					if (key.slice(0, filter.length) === filter) {
						this.target.removeItem(key);
					}
				});
			}
		}

		// Reset the lastChange
		this.target.setItem('last-change', JSON.stringify(now));
		// Return the amount of inactivity
		return inactivity;
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
