/* eslint-disable import/no-extraneous-dependencies */
const nodeExternals = require('webpack-node-externals');
/* eslint-enable import/no-extraneous-dependencies */

module.exports = {
	entry: './index.js',
	output: {
		filename: './dist/storageUtility.js',
		libraryTarget: 'umd',
	},
	externals: [nodeExternals()],
	module: {
		loaders: [
			{
				test: /\.jsx?$/,
				exclude: /(node_modules|bower_components)/,
				loader: 'babel-loader',
				query: {
					presets: ['env'],
				},
			},
		],
	},
};
