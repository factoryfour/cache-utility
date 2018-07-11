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
		ExampleUtility = new StorageUtility(config);
	});

	it('should properly initialize tierMap', () => {
		expect(ExampleUtility.tierMap).toMatchSnapshot();
	});

	it('should properly set a value in target', () => {
		const testValue = { hello: '123' };
		expect(localStorage.length).toBe(0);
		expect(sessionStorage.length).toBe(0);
		ExampleUtility.set('test', testValue, 'A');
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

	it('should persist long term tier over short term tier after get', (done) => {
		ExampleUtility.set('test', { hello: '123' }, 'A');
		ExampleUtility.set('test', { hello: '321' }, 'B');
		expect(sessionStorage.length).toBe(2);
		setTimeout(() => {
			const result = ExampleUtility.get('test', 'B');
			expect(result).toMatchSnapshot();
			expect(sessionStorage.length).toBe(1);
			expect(sessionStorage.removeItem).toHaveBeenCalledWith('C-B-A-test');
			done();
		}, 750);
	});

	it('should persist long term tier over short term tier after set', (done) => {
		ExampleUtility.set('test', { hello: '123' }, 'A');
		ExampleUtility.set('test', { hello: '321' }, 'B');
		expect(sessionStorage.length).toBe(2);
		setTimeout(() => {
			ExampleUtility.set('test', { hello: '456' }, 'C');
			expect(sessionStorage.length).toBe(2);
			expect(sessionStorage.removeItem).toHaveBeenCalledWith('C-B-A-test');
			expect(sessionStorage.__STORE__).toMatchSnapshot(); // eslint-disable-line
			done();
		}, 750);
	});
});
