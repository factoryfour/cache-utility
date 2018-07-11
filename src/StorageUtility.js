class StorageUtility {
	constructor(config) {
		// Initialize lastChange as when first constructed
		this.lastChange = new Date().now();
		// Determine the target storage entity on the window
		this.target = window[config.target];
		// Store the desired tiers
		this.tiers = config.tiers;
	}
}

export default StorageUtility;
