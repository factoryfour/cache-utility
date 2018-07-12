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
		// Reset the ExampleUtility
		ExampleUtility = new StorageUtility(config);
		// Make console.error a mock
		console.error = jest.fn();
	});

	it('should properly initialize tierMap', () => {
		expect(ExampleUtility.tierMap).toMatchSnapshot();
	});

	it('should properly set a value in target', () => {
		const testValue = { hello: '123' };
		expect(localStorage.length).toBe(0);
		expect(sessionStorage.length).toBe(0);
		const result = ExampleUtility.set('test', testValue, 'A');
		expect(result).toBe(true);
		expect(localStorage.length).toBe(0);
		expect(sessionStorage.length).toBe(1);
		expect(sessionStorage.setItem).toHaveBeenCalledWith('C-B-A-test', JSON.stringify(testValue));
		expect(sessionStorage.__STORE__['C-B-A-test']).toMatchSnapshot(); // eslint-disable-line
	});

	it('should properly get a value in target', () => {
		const testValue = { hello: '123' };
		ExampleUtility.set('test', testValue, 'A');
		const result = ExampleUtility.get('test', 'A');
		expect(result).toMatchSnapshot();
	});

	it('should return null when getting from an invalid tier', () => {
		const testValue = { hello: '123' };
		ExampleUtility.set('test', testValue, 'A');
		const result = ExampleUtility.get('test', 'D');
		expect(result).toBe(null);
		expect(console.error).toHaveBeenCalledWith('Tier D does not exist'); // Should alert the user
	});

	it('should return null when setting to an invalid tier', () => {
		const result = ExampleUtility.set('test', { hello: '123' }, 'E');
		expect(result).toBe(null);
		expect(console.error).toHaveBeenCalledWith('Tier E does not exist'); // Should alert the user
	});

	it('should return null if getting a key that doesn\'t exist in store', () => {
		const testValue = { hello: '123' };
		ExampleUtility.set('test', testValue, 'A');
		const result = ExampleUtility.get('test', 'B');
		expect(result).toBe(null);
	});

	it('should return null when attempting to get after the tier has expired and remove key from store', (done) => {
		const testValue = { hello: '123' };
		ExampleUtility.set('test', testValue, 'A');
		setTimeout(() => {
			const result = ExampleUtility.get('test', 'A');
			expect(result).toBe(null);
			expect(sessionStorage.length).toBe(0);
			expect(sessionStorage.removeItem).toHaveBeenCalledWith('C-B-A-test');
			done();
		}, 750);
	});

	it('should persist all tiers if not enough inactivity', (done) => {
		ExampleUtility.set('test', { hello: '123' }, 'A');
		ExampleUtility.set('test', { hello: '321' }, 'B');
		ExampleUtility.set('test', { hello: '456' }, 'C');
		expect(sessionStorage.length).toBe(3);
		setTimeout(() => {
			const result = ExampleUtility.get('test', 'A');
			expect(sessionStorage.length).toBe(3);
			expect(result).not.toBe(null);
			expect(sessionStorage.__STORE__).toMatchSnapshot(); // eslint-disable-line
			done();
		}, 250);
	});

	it('should persist Tiers B, C after Tier A has expired', (done) => {
		ExampleUtility.set('test', { hello: '123' }, 'A');
		ExampleUtility.set('test', { hello: '321' }, 'B');
		ExampleUtility.set('test', { hello: '456' }, 'C');
		expect(sessionStorage.length).toBe(3);
		setTimeout(() => {
			const result = ExampleUtility.get('test', 'A');
			expect(sessionStorage.length).toBe(2);
			expect(result).toBe(null);
			expect(sessionStorage.__STORE__).toMatchSnapshot(); // eslint-disable-line
			expect(sessionStorage.removeItem).toHaveBeenCalledWith('C-B-A-test');
			done();
		}, 750);
	});

	it('should persist Tier C after Tiers A, B have expired', (done) => {
		ExampleUtility.set('test', { hello: '123' }, 'A');
		ExampleUtility.set('test', { hello: '321' }, 'B');
		ExampleUtility.set('test', { hello: '456' }, 'C');
		expect(sessionStorage.length).toBe(3);
		setTimeout(() => {
			const result = ExampleUtility.get('test', 'B');
			expect(result).toBe(null);
			expect(sessionStorage.length).toBe(1);
			expect(sessionStorage.__STORE__).toMatchSnapshot(); // eslint-disable-line
			expect(sessionStorage.removeItem).toHaveBeenCalledWith('C-B-A-test');
			expect(sessionStorage.removeItem).toHaveBeenCalledWith('C-B-test');
			done();
		}, 1250);
	});

	it('should remove all tiers if enough inactivity', (done) => {
		ExampleUtility.set('test', { hello: '123' }, 'A');
		ExampleUtility.set('test', { hello: '321' }, 'B');
		ExampleUtility.set('test', { hello: '456' }, 'C');
		expect(sessionStorage.length).toBe(3);
		setTimeout(() => {
			const result = ExampleUtility.get('test', 'C');
			expect(sessionStorage.length).toBe(0);
			expect(result).toBe(null);
			expect(sessionStorage.__STORE__).toMatchSnapshot(); // eslint-disable-line
			expect(sessionStorage.removeItem).toHaveBeenCalledWith('C-B-A-test');
			expect(sessionStorage.removeItem).toHaveBeenCalledWith('C-B-test');
			expect(sessionStorage.removeItem).toHaveBeenCalledWith('C-test');
			done();
		}, 1750);
	});
});
