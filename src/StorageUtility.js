class StorageUtility {
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
			console.warn(`Tier ${tier} does not exist`);
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
			console.warn(`Tier ${tier} does not exist`);
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

		this.target.setItem(newKey, newValue);
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
}

export default StorageUtility;
