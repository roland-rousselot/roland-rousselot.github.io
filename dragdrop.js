

'use strict';

const CANVAS_SCREEN_PROPORTION = 0.85;
const CANVAS_BACKGROUND_COLOR = '#1f1f1f';
const TEXT_COLOR = '#FFFFFF';
const TEXT_SIZE = 24;
const TEXT_FONT = '24px Arial';

function get_canvas(){
	const canvas = document.getElementById('canvas');
	return canvas;
}

function get_relative_position(mouse_event){
	let bounding_rectangle = mouse_event.target.getBoundingClientRect();
	let mouse_x = mouse_event.clientX - bounding_rectangle.left;
	let mouse_y = mouse_event.clientY - bounding_rectangle.top;
	let relative_position = [mouse_x, mouse_y];
	return relative_position;
}

class Scene{

	constructor(canvas){
		this.initialize_canvas(canvas);
		this.base_functions = [];
		this.elements = [];
	}

	initialize_canvas(canvas){
		this.canvas = canvas;
		this.resize_canvas();
		this.context = canvas.getContext('2d');
		canvas.addEventListener("mousedown",(mouse_event)=>this.process_mousedown(mouse_event));
	}

	resize_canvas(){
		let minimum_dimension = Math.min(window.innerWidth, window.innerHeight);
		this.canvas.width = CANVAS_SCREEN_PROPORTION*minimum_dimension;
		this.canvas.height = CANVAS_SCREEN_PROPORTION*minimum_dimension;
	}

	loop(){
		this.resize_canvas();
		this.run_base_functions();
		this.render_elements();
		window.requestAnimationFrame(()=>this.loop());
	}

	run_base_functions(){
		for (let i = 0; i < this.base_functions.length; i++){
			this.base_functions[i]();
		}
	}

	render_elements(){
		this.sort_elements();
		this.render_base();
		for (let i = 0; i < this.elements.length; i++){
			this.elements[i].render(this.context);
		}
	}

	render_base(){
		this.context.fillStyle = CANVAS_BACKGROUND_COLOR;
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}

	process_mousedown(mouse_event){
		if (mouse_event.button != 0){return 1}
		this.sort_elements();
		let [mouse_x, mouse_y] = get_relative_position(mouse_event);
		this.delegate_mousedown(mouse_x, mouse_y);
	}

	sort_elements(){
		this.elements.sort((element_1, element_2)=>(element_1.priority-element_2.priority));
	}

	delegate_mousedown(mouse_x, mouse_y){
		let reversed_elements = this.elements.toReversed();
		for (let i = 0; i < reversed_elements.length; i++){
			let element = reversed_elements[i];
			let collision = element.check_collision(mouse_x, mouse_y);
			if(collision){element.handle_mousedown(mouse_x, mouse_y);break;}
		}
	}

	add_element(element){
		this.elements.push(element);
		element.scene = this;
	}
}

class Rectangle{

	constructor(color, location, dimensions){
		this.color = color;
		this.location = location;
		this.dimensions = dimensions;
		this.priority = Date.now();
		this.text = "";
	}

	render(context){
		let [x_location, y_location] = this.location;
		let [x_dimension, y_dimension] = this.dimensions;
		this.render_base(context, x_location, y_location, x_dimension, y_dimension);
		this.render_text(context, x_location, y_location, x_dimension, y_dimension);
	}

	render_base(context, x_location, y_location, x_dimension, y_dimension){
		context.fillStyle = this.color;
		context.fillRect(x_location, y_location, x_dimension, y_dimension);
	}

	render_text(context, x_location, y_location, x_dimension, y_dimension){
		this.set_context_for_text(context);
		let text_width = context.measureText(this.text).width;
		let text_x = x_location + x_dimension/2 - text_width/2;
		let text_y = y_location + y_dimension/2 + TEXT_SIZE/3;
		context.fillText(this.text, text_x, text_y);
	}

	set_context_for_text(context){
		context.fillStyle = TEXT_COLOR;
		context.font = TEXT_FONT;
	}

	set_text(text){
		this.text = text;
	}

	check_collision(x, y){
		let [x_min, x_max, y_min, y_max] = this.get_bounds();
		let x_collision = ((x_min <= x) && (x <= x_max));
		let y_collision = ((y_min <= y) && (y <= y_max));
		let collision = (x_collision && y_collision);
		return collision;
	}

	get_bounds(){
		let [x_min, y_min] = this.location;
		let [x_dimension, y_dimension] = this.dimensions;
		let [x_max, y_max] = [x_min + x_dimension, y_min + y_dimension];
		let bounds = [x_min, x_max, y_min, y_max];
		return bounds;
	}

	handle_mousedown(mouse_x, mouse_y){
		this.priority = Date.now();
		let offset_x = this.location[0] - mouse_x;
		let offset_y = this.location[1] - mouse_y;
		this.mousemove_function = (mouse_event)=>this.drag(mouse_event, offset_x, offset_y);
		this.remove_function = ()=>this.remove_drag();
		addEventListener("mousemove", this.mousemove_function);
		addEventListener("mouseup", this.remove_function);
	}

	drag(mouse_event, offset_x, offset_y){
		let [mouse_x, mouse_y] = get_relative_position(mouse_event);
		this.location[0] = mouse_x + offset_x;
		this.location[1] = mouse_y + offset_y;    
	}

	remove_drag(){
		removeEventListener("mousemove", this.mousemove_function);
		removeEventListener("mouseup", this.remove_function);
	}
}

class Circle{

	constructor(color, location, radius){
		this.color = color;
		this.location = location;
		this.radius = radius;
		this.priority = Date.now();
	}

	render(context){
		context.fillStyle = this.color;
		let [x_location, y_location] = this.location;
		
		context.arc(x_location, y_location, this.radius, 0, 2 * Math.PI, false);
		context.fill();
		context.lineWidth = 5;
		context.strokeStyle = "black";
		context.stroke();
	}

	check_collision(x, y){
		let [x_location, y_location] = this.location;
		let collision = ((x - x_location)**2 + (y - y_location)**2 <= this.radius**2);
		return collision;
	}

	handle_mousedown(mouse_x, mouse_y){
		this.priority = Date.now();
		let offset_x = this.location[0] - mouse_x;
		let offset_y = this.location[1] - mouse_y;
		this.mousemove_function = (mouse_event)=>this.drag(mouse_event, offset_x, offset_y);
		this.remove_function = ()=>this.remove_drag();
		addEventListener("mousemove", this.mousemove_function);
		addEventListener("mouseup", this.remove_function);
	}

	drag(mouse_event, offset_x, offset_y){
		let [mouse_x, mouse_y] = get_relative_position(mouse_event);
		this.location[0] = mouse_x + offset_x;
		this.location[1] = mouse_y + offset_y;    
	}

	remove_drag(){
		removeEventListener("mousemove", this.mousemove_function);
		removeEventListener("mouseup", this.remove_function);
	}
}



console.clear();

const canvas = get_canvas();
const scene = new Scene(canvas);
const red_rectangle = new Rectangle('red',[40,40], [200,200]);
const green_rectangle = new Rectangle('green ',[200,140], [400,300]);
const blue_circle = new Circle('blue', [100,300], 80);

red_rectangle.set_text('Red Rectangle')
green_rectangle.set_text('Now I can set text!')

scene.add_element(red_rectangle);
scene.add_element(green_rectangle);
scene.add_element(blue_circle);
scene.loop();




/*

To do:

Change shapes to take in a points object
Add zooming and panning
Add outlines

*/

