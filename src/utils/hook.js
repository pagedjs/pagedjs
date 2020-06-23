/**
 * Hooks allow for injecting functions that must all complete in order before finishing
 * They will execute in parallel but all must finish before continuing
 * Functions may return a promise if they are asycn.
 * From epubjs/src/utils/hooks
 * @param {any} context scope of this
 * @example this.content = new Hook(this);
 */
class Hook {
	constructor(context){
		this.context = context || this;
		this.hooks = [];
	}

	/**
	 * Adds a function to be run before a hook completes
	 * @example this.content.register(function(){...});
	 * @return {undefined} void
	 */
	register(){
		for(var i = 0; i < arguments.length; ++i) {
			if (typeof arguments[i]  === "function") {
				this.hooks.push(arguments[i]);
			} else {
				// unpack array
				for(var j = 0; j < arguments[i].length; ++j) {
					this.hooks.push(arguments[i][j]);
				}
			}
		}
	}

	/**
	 * Triggers a hook to run all functions
	 * @example this.content.trigger(args).then(function(){...});
	 * @return {Promise} results
	 */
	trigger(){
		var args = arguments;
		var context = this.context;
		var promises = [];

		this.hooks.forEach(function(task) {
			var executing = task.apply(context, args);

			if(executing && typeof executing["then"] === "function") {
				// Task is a function that returns a promise
				promises.push(executing);
			} else {
				// Otherwise Task resolves immediately, add resolved promise with result
				promises.push(new Promise((resolve, reject) => {
					resolve(executing);
				}));
			}
		});


		return Promise.all(promises);
	}

	/**
   * Triggers a hook to run all functions synchronously
   * @example this.content.trigger(args).then(function(){...});
   * @return {Array} results
   */
	triggerSync(){
		var args = arguments;
		var context = this.context;
		var results = [];

		this.hooks.forEach(function(task) {
			var executing = task.apply(context, args);

			results.push(executing);
		});


		return results;
	}

	// Adds a function to be run before a hook completes
	list(){
		return this.hooks;
	}

	clear(){
		return this.hooks = [];
	}
}
export default Hook;
