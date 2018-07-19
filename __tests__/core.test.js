import StorageUtility from '../index';

const testTiers = [
	{
		name: 'A',
		expiration: 500,
	},
	{
		name: 'B',
		expiration: 1000,
	},
	{
		name: 'C',
		expiration: 1500,
	},
	{
		name: 'D Tier', // Invalid, should be excluded from tiers
		expiration: 3000,
	},
];

const config = {
	target: 'sessionStorage',
	tiers: testTiers,
};

describe('StorageUtility', () => {
	let ExampleUtility;

	beforeEach(() => {
		// Wipe session storage so we have a clean slate
		sessionStorage.clear();
		sessionStorage.setItem.mockClear();
		sessionStorage.removeItem.mockClear();
		// Make console.error a mock
		console.error = jest.fn();
		// Reset the ExampleUtility
		ExampleUtility = new StorageUtility(config);
	});

	/* eslint-disable no-underscore-dangle */
	it('should properly initialize tierMap', () => {
		expect(ExampleUtility.tierMap).toMatchSnapshot();
		expect(console.error).toHaveBeenCalledWith('Invalid tier name "D Tier" with whitespace');
	});

	it('should properly set a value in target', () => {
		const testValue = { hello: '123' };
		expect(localStorage.length).toBe(0);
		expect(sessionStorage.length).toBe(1);
		const result = ExampleUtility.set('test', testValue, 'A');
		expect(result).toBe(true);
		expect(localStorage.length).toBe(0);
		expect(sessionStorage.length).toBe(2);
		expect(sessionStorage.setItem).toHaveBeenCalledWith('C-B-A-test', JSON.stringify(testValue));
		expect(sessionStorage.__STORE__['C-B-A-test']).toMatchSnapshot();
	});

	it('should properly get a value in target', () => {
		const testValue = { hello: '123' };
		ExampleUtility.set('test', testValue, 'A');
		const result = ExampleUtility.get('test');
		expect(result).toMatchSnapshot();
	});

	it('should properly remove a value in target', () => {
		ExampleUtility.set('test', { hello: '123' }, 'A');
		const result = ExampleUtility.remove('test');
		const result2 = ExampleUtility.get('test');
		// This key should be removed from the keyMap
		expect(ExampleUtility.keyMap.test).toBe(undefined);
		expect(sessionStorage.length).toBe(1);
		expect(result).toBe(true);
		expect(result2).toBe(null); // Getting a previously defined key should return null
		expect(sessionStorage.removeItem).toHaveBeenCalledWith('C-B-A-test');
	});

	it('should return false when removing a key that doesn\'t exist', () => {
		ExampleUtility.set('test', { hello: '123' }, 'A');
		const result = ExampleUtility.remove('test2');
		expect(result).toBe(false);
		expect(sessionStorage.length).toBe(2);
	});

	it('should return null when getting from a key that doesn\'t exist', () => {
		const testValue = { hello: '123' };
		ExampleUtility.set('test', testValue, 'A');
		const result = ExampleUtility.get('test2');
		expect(result).toBe(null);
	});

	it('should return false when setting to an invalid tier', () => {
		const result = ExampleUtility.set('test', { hello: '123' }, 'E');
		expect(result).toBe(false);
		expect(console.error).toHaveBeenCalledWith('Tier E does not exist'); // Should alert the user
	});

	it('should return false when attempting to set an existing key within a new tier', () => {
		const testValue = { hello: '123' };
		ExampleUtility.set('test', testValue, 'A');
		expect(ExampleUtility.set('test', testValue, 'B')).toBe(false);
		expect(console.error).toHaveBeenCalledWith('Cannot set existing key test new tier B');
	});

	it('should return false when attempting to set a key with a tier name included', () => {
		const testValue = { hello: '123' };
		expect(ExampleUtility.set('testA', testValue, 'B')).toBe(false);
		expect(console.error).toHaveBeenCalledWith('Cannot include tier name in key name');
	});

	it('should return null when attempting to get after the tier has expired and remove key from store', (done) => {
		const testValue = { hello: '123' };
		ExampleUtility.set('test', testValue, 'A');
		setTimeout(() => {
			const result = ExampleUtility.get('test');
			expect(result).toBe(null);
			expect(sessionStorage.length).toBe(1);
			expect(sessionStorage.removeItem).toHaveBeenCalledWith('C-B-A-test');
			done();
		}, 750);
	});

	it('should persist all tiers if not enough inactivity', (done) => {
		ExampleUtility.set('test', { hello: '123' }, 'A');
		ExampleUtility.set('test2', { hello: '321' }, 'B');
		ExampleUtility.set('test3', { hello: '456' }, 'C');
		expect(sessionStorage.length).toBe(4);
		setTimeout(() => {
			const result = ExampleUtility.get('test');
			expect(sessionStorage.length).toBe(4);
			expect(result).not.toBe(null);
			expect(sessionStorage.__STORE__['last-change']).toBeTruthy();
			delete sessionStorage.__STORE__['last-change']; // Because timestamp will ruin snapshot
			expect(sessionStorage.__STORE__).toMatchSnapshot();
			done();
		}, 250);
	});

	it('should remove all keys in tiers (but spare those outside)', (done) => {
		ExampleUtility.set('test', { hello: '123' }, 'A');
		ExampleUtility.set('test2', { hello: '321' }, 'B');
		ExampleUtility.set('test3', { hello: '456' }, 'C');
		sessionStorage.setItem('another', 'value');
		expect(sessionStorage.length).toBe(5);
		setTimeout(() => {
			ExampleUtility.removeAll();
			expect(sessionStorage.length).toBe(2);
			// Remove all keys in the keyMap
			expect(Object.keys(ExampleUtility.keyMap).length).toBe(0);
			expect(sessionStorage.__STORE__['last-change']).toBeTruthy();
			delete sessionStorage.__STORE__['last-change']; // Because timestamp will ruin snapshot
			expect(sessionStorage.__STORE__).toMatchSnapshot();
			done();
		}, 250);
	});

	it('should persist Tiers B, C after Tier A has expired', (done) => {
		ExampleUtility.set('test', { hello: '123' }, 'A');
		ExampleUtility.set('test2', { hello: '321' }, 'B');
		ExampleUtility.set('test3', { hello: '456' }, 'C');
		expect(sessionStorage.length).toBe(4);
		setTimeout(() => {
			const result = ExampleUtility.get('test');
			expect(sessionStorage.length).toBe(3);
			expect(result).toBe(null);
			expect(sessionStorage.__STORE__['last-change']).toBeTruthy();
			delete sessionStorage.__STORE__['last-change']; // Because timestamp will ruin snapshot
			expect(sessionStorage.__STORE__).toMatchSnapshot();
			expect(sessionStorage.removeItem).toHaveBeenCalledWith('C-B-A-test');
			done();
		}, 750);
	});

	it('should persist Tier C after Tiers A, B have expired', (done) => {
		ExampleUtility.set('test', { hello: '123' }, 'A');
		ExampleUtility.set('test2', { hello: '321' }, 'B');
		ExampleUtility.set('test3', { hello: '456' }, 'C');
		expect(sessionStorage.length).toBe(4);
		setTimeout(() => {
			const result = ExampleUtility.get('test2');
			expect(result).toBe(null);
			expect(sessionStorage.length).toBe(2);
			expect(sessionStorage.__STORE__['last-change']).toBeTruthy();
			delete sessionStorage.__STORE__['last-change']; // Because timestamp will ruin snapshot
			expect(sessionStorage.__STORE__).toMatchSnapshot();
			expect(sessionStorage.removeItem).toHaveBeenCalledWith('C-B-A-test');
			expect(sessionStorage.removeItem).toHaveBeenCalledWith('C-B-test2');
			done();
		}, 1250);
	});

	it('should remove all tiers if enough inactivity', (done) => {
		ExampleUtility.set('test', { hello: '123' }, 'A');
		ExampleUtility.set('test2', { hello: '321' }, 'B');
		ExampleUtility.set('test3', { hello: '456' }, 'C');
		expect(sessionStorage.length).toBe(4);
		setTimeout(() => {
			const result = ExampleUtility.get('test3');
			expect(sessionStorage.length).toBe(1);
			expect(result).toBe(null);
			delete sessionStorage.__STORE__['last-change']; // Because timestamp will ruin snapshot
			expect(sessionStorage.__STORE__).toMatchSnapshot();
			expect(sessionStorage.removeItem).toHaveBeenCalledWith('C-B-A-test');
			expect(sessionStorage.removeItem).toHaveBeenCalledWith('C-B-test2');
			expect(sessionStorage.removeItem).toHaveBeenCalledWith('C-test3');
			done();
		}, 1750);
	});

	/* eslint-enable no-underscore-dangle */
});
