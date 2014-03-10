
var People = {

	reg: function(name, home, age) {
		People.name = name;
		People.home = home;
		People.age = age;
	},

	profile: function() {
		var profile = People.name + ' is ' + People.age + ', living in ' + People.home;
		alert(profile);
	}

};

People.reg('Alex', 'Beijing', 18);
//People.profile();
