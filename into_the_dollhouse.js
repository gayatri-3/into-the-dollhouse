import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Cube, Axis_Arrows, Textured_Phong} = defs

export class Dollhouse extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        //set initial camera view
        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));

        //set game over camera view
        this.game_over_camera_location = Mat4.look_at(vec3(0, 100, 20), vec3(0, 100, 0), vec3(0, 1, 0));

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            //basic shapes
            box: new defs.Cube(),
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(50,50),
            square: new defs.Square(),
            torus: new defs.Torus(15, 15),
            torus2: new defs.Torus(3, 15),

            //Floor
            //want to be textured with like a pink shag rug
            floor: new defs.Capped_Cylinder(30, 30, [[0 , 2], [0, 1]]),
            //floor: new defs.Cube(),

            //Player
            //want to import object to make it look like a doll,
            // but for now we are leaving this as a sphere
            player: new defs.Subdivision_Sphere(4),

            //Dead End 1: hair brush
            //want to use image for this -- so need to import image file!
            brush: new defs.Cube(),

            //Dead End 2: sofa
            //want to use image for this -- so need to import image file!
            sofa: new defs.Cube(),

            //Wall
            wall: new defs.Cube(),


        };

        // *** Materials
        this.materials = {
            floor: new Material(new Rug_Texture(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/shag_rug.png")
            }),

            player: new Material(new defs.Phong_Shader(),
                {ambient: 0, diffusivity: 1, specularity: 0, color: hex_color("#68FCFA")}),

            brush: new Material(new defs.Phong_Shader(),
                {ambient: 0, diffusivity: 1, specularity: 0, color: hex_color("#CFAFFA")}),

            sofa:new Material(new defs.Phong_Shader(),
                {ambient: 0, diffusivity: 1, specularity: 0, color: hex_color("#AFFADC")}),

            wall:new Material(new defs.Phong_Shader(),
                {ambient: 0, diffusivity: 1, specularity: 0, color: hex_color("#FC6C85")}),

            //game_over_image: new Material(new defs.Phong_Shader(),
            //    {ambient: 1, diffusivity: 0, specularity: 0, texture: new Texture("assets/game_over_2.jpg")}),

            game_over_image: new Material(new Rug_Texture(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/game_over.png")
                //why doesn't game_over.jpg work?
            }),
        }

        /* Player initial coordinates */
        this.z_movement = 0;
        this.x_movement = 0;

        //collision
        this.collision = false;

    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        //main scene view
        //this.key_triggered_button("View Scene", ["Control", "0"], () => this.attached = () => this.initial_camera_location);

        //this.new_line()
        //this.key_triggered_button("Attach to Doll", ["Control", "1"], () => this.attached = () => this.player);
        //this.new_line();

        // PLAYER MOVEMENT

        // Up (arrow key up)
        this.key_triggered_button("Up", ['ArrowUp'], () => {

            if (!this.collision) {
                this.z_movement = this.z_movement - 1;
            }
                console.log("up pressed");

        });
        // Down (arrow key down)
        this.key_triggered_button("Down", ['ArrowDown'], () => {

            if (!this.collision) {
                this.z_movement = this.z_movement + 1;
            }
            console.log("down pressed");
        });

        // Left (arrow key left)
        this.key_triggered_button("Left", ['ArrowLeft'], () => {
            if (!this.collision) {
                this.x_movement = this.x_movement - 1;
            }
            console.log("left pressed");
        });

        // Right Movement (arrow key right)
        this.key_triggered_button("Right", ['ArrowRight'], () => {

            // only allow if it would not result in a collision
            if (!this.collision) {
                this.x_movement = this.x_movement + 1;
            }
            //this.collision = false;
            console.log("right pressed");

        });
    }

    display(context, program_state) {
        //console.log("display called");
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);


        //Basic setup variables
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        let model_transform = Mat4.identity();

        //lighting
        const light_position = vec4(0, 20, 0, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        //player
        let player_transform = model_transform;
        player_transform = player_transform.times(Mat4.translation(this.x_movement, 0, this.z_movement));
        this.shapes.player.draw(context, program_state, player_transform, this.materials.player);

        //floor
        let floor_transform = model_transform;
        floor_transform = model_transform.times(Mat4.rotation(0, 0, 1, 0))
            .times(Mat4.rotation(Math.PI / 2, 1, 0, 0))
            .times(Mat4.translation(0, 0, 2))
            .times(Mat4.scale(100, 100, 0.5));
        this.shapes.floor.draw(context, program_state, floor_transform, this.materials.floor);

        //brush
        let brush_transform = model_transform;
        brush_transform = brush_transform.times(Mat4.translation(-9, 0, -3))
            .times(Mat4.scale(1.5, 1.5, 1.5));
        this.shapes.brush.draw(context, program_state, brush_transform, this.materials.brush);

        //sofa
        let sofa_transform = model_transform;
        sofa_transform = sofa_transform.times(Mat4.translation(15, 0, -10))
            .times(Mat4.scale(2.5, 1, 1));
        this.shapes.sofa.draw(context, program_state, sofa_transform, this.materials.sofa);

        this.draw_maze(context, program_state, model_transform);
        //console.log(player_transform);

        //if you collided with a wall, game over screen appears
        if (this.collision){
            console.log("game over");


            //set game over camera view
            //this.game_over_camera_location = Mat4.look_at(vec3(0, 100, 20), vec3(0, 100, 0), vec3(0, 1, 0));

            //initial camera location
            //Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));

            //camera to set on the game over screen
            program_state.set_camera(Mat4.look_at(vec3(0, 10, -60), vec3(0, 10, -70), vec3(0, 1, 0)));
            let game_over_transform = model_transform;
            game_over_transform = game_over_transform.times(Mat4.translation(0, 10, -70)).times(Mat4.scale(8, 6, 0));
            this.shapes.square.draw(context, program_state, game_over_transform, this.materials.game_over_image);

            //this.shapes.square.draw(context, program_state, Mat4.identity().times(Mat4.rotation(90, 1, 0, 0)).times(Mat4.translation(0, -20, 0)), this.materials.game_over_image);
            //this.shapes.text.set_string("loading...", context.context);


            //copied from bird's eye view matrix
            //this.inverse().set(Mat4.look_at(vec3(0, 150, 40), vec3(0, 0, 0), vec3(0, 1, 0)));
            //this.matrix().set(Mat4.inverse(this.inverse()));
        }

    }

    check_collision(model_transform, x_width, z_width){
        //check if collision with player and the matrix that is inputed.
        //check wall collisions
        if (this.x_movement + 1 >= model_transform[0][3] - x_width && this.x_movement - 1 <= model_transform[0][3] + x_width
            && this.z_movement + 1 >= model_transform[2][3] - z_width && this.z_movement - 1 <= model_transform[2][3] + z_width  ){
            console.log("collision");
            this.collision = true;
        }
    }

draw_maze(context, program_state, model_transform) {
        //walls
        //left when first start
        let wall1a_transform = model_transform;
        wall1a_transform = wall1a_transform.times(Mat4.translation(-4, 3, 12))
            .times(Mat4.scale(0.5, 5, 10));
        this.shapes.wall.draw(context, program_state, wall1a_transform, this.materials.wall);
        this.check_collision(wall1a_transform, 0.5, 10);

        //second part of left wall
        let wall1b_transform = model_transform;
        wall1b_transform = wall1b_transform.times(Mat4.translation(-4, 3, -13))
            .times(Mat4.scale(0.5, 5, 5));
        this.shapes.wall.draw(context, program_state, wall1b_transform, this.materials.wall);
        this.check_collision(wall1b_transform, 0.5, 5);

        //back wall of 1st dead end
        let wall1c_transform = model_transform;
        wall1c_transform = wall1c_transform.times(Mat4.translation(-12, 3, -2.5))
            .times(Mat4.scale(0.5, 5, 5.5));
        this.shapes.wall.draw(context, program_state, wall1c_transform, this.materials.wall);
        this.check_collision(wall1c_transform, 0.5, 5.5);

        //left wall of 1st dead end
        let wall1d_transform = model_transform;
        wall1d_transform = wall1d_transform.times(Mat4.translation(-8.5, 3, -8.5))
            .times(Mat4.scale(4, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall1d_transform, this.materials.wall);
        this.check_collision(wall1d_transform, 4, 0.5);

        //right wall of 1st dead end
        let wall1e_transform = model_transform;
        wall1e_transform = wall1e_transform.times(Mat4.translation(-8, 3, 2.5))
            .times(Mat4.scale(4, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall1e_transform, this.materials.wall);
        this.check_collision(wall1e_transform, 4, 0.5);

        let wall1f_transform = model_transform;
        wall1f_transform = wall1f_transform.times(Mat4.translation(-4, 3, -30))
            .times(Mat4.scale(0.5, 5, 5));
        this.shapes.wall.draw(context, program_state, wall1f_transform, this.materials.wall);
        this.check_collision(wall1f_transform, 0.5, 5);

        //right wall when first start
        let wall2_transform = model_transform;
        wall2_transform = wall2_transform.times(Mat4.translation(8, 3, -16))
            .times(Mat4.scale(0.5, 5, 30));
        this.shapes.wall.draw(context, program_state, wall2_transform, this.materials.wall);
        this.check_collision(wall2_transform, 0.5, 30);


        let wall3_transform = model_transform;
        wall3_transform = wall3_transform.times(Mat4.translation(-13.5, 3, -46.5))
            .times(Mat4.scale(22, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall3_transform, this.materials.wall);
        this.check_collision(wall3_transform, 22, 0.5);

        let wall4_transform = model_transform;
        wall4_transform = wall4_transform.times(Mat4.translation(-13.5, 3, -35.5))
            .times(Mat4.scale(10, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall4_transform, this.materials.wall);
        this.check_collision(wall4_transform, 10, 0.5);

        let wall5_transform = model_transform;
        wall5_transform = wall5_transform.times(Mat4.translation(-35, 3, -31.5))
            .times(Mat4.scale(0.5, 5, 15));
        this.shapes.wall.draw(context, program_state, wall5_transform, this.materials.wall);
        this.check_collision(wall5_transform, 0.5, 15);

        let wall6_transform = model_transform;
        wall6_transform = wall6_transform.times(Mat4.translation(-23.5, 3, -21))
            .times(Mat4.scale(0.5, 5, 15));
        this.shapes.wall.draw(context, program_state, wall6_transform, this.materials.wall);
        this.check_collision(wall6_transform, 0.5, 15);

        let wall7_transform = model_transform;
        wall7_transform = wall7_transform.times(Mat4.translation(-38, 3, -6))
            .times(Mat4.scale(15, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall7_transform, this.materials.wall);
        this.check_collision(wall7_transform, 15, 0.5);

        let wall8_transform = model_transform;
        wall8_transform = wall8_transform.times(Mat4.translation(-45, 3, -17))
            .times(Mat4.scale(10, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall8_transform, this.materials.wall);
        this.check_collision(wall8_transform, 10, 0.5);

        let wall9_transform = model_transform;
        wall9_transform = wall9_transform.times(Mat4.translation(-53, 3, 1.5))
            .times(Mat4.scale(0.5, 5, 8));
        this.shapes.wall.draw(context, program_state, wall9_transform, this.materials.wall);
        this.check_collision(wall9_transform, 0.5, 8);

        let wall10_transform = model_transform;
        wall10_transform = wall10_transform.times(Mat4.translation(-66, 3, -18))
            .times(Mat4.scale(0.5, 5, 40));
        this.shapes.wall.draw(context, program_state, wall10_transform, this.materials.wall);
        this.check_collision(wall10_transform, 0.5, 40);

        let wall11_transform = model_transform;
        wall11_transform = wall11_transform.times(Mat4.translation(-34.5, 3, 10))
            .times(Mat4.scale(19, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall11_transform, this.materials.wall);
        this.check_collision(wall11_transform, 19, 0.5);

        let wall12_transform = model_transform;
        wall12_transform = wall12_transform.times(Mat4.translation(-47, 3, 22))
            .times(Mat4.scale(19, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall12_transform, this.materials.wall);
        this.check_collision(wall12_transform, 19, 0.5);

        let wall13_transform = model_transform;
        wall13_transform = wall13_transform.times(Mat4.translation(-16, 3, 25))
            .times(Mat4.scale(0.5, 5, 15));
        this.shapes.wall.draw(context, program_state, wall13_transform, this.materials.wall);
        this.check_collision(wall13_transform, 0.5, 15);

        let wall14_transform = model_transform;
        wall14_transform = wall14_transform.times(Mat4.translation(-28.5, 3, 37))
            .times(Mat4.scale(0.5, 5, 15));
        this.shapes.wall.draw(context, program_state, wall14_transform, this.materials.wall);
        this.check_collision(wall14_transform, 0.5, 15);

        let wall15_transform = model_transform;
        wall15_transform = wall15_transform.times(Mat4.translation(-1.5, 3, 40.5))
            .times(Mat4.scale(15, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall15_transform, this.materials.wall);
        this.check_collision(wall15_transform, 15, 0.5);

        let wall16_transform = model_transform;
        wall16_transform = wall16_transform.times(Mat4.translation(-2, 3, 52.5))
            .times(Mat4.scale(27, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall16_transform, this.materials.wall);
        this.check_collision(wall16_transform, 27, 0.5);

        let wall17_transform = model_transform;
        wall17_transform = wall17_transform.times(Mat4.translation(24.5, 3, 44))
            .times(Mat4.scale(0.5, 5, 9));
        this.shapes.wall.draw(context, program_state, wall17_transform, this.materials.wall);
        this.check_collision(wall17_transform, 0.5, 9);

        let wall18_transform = model_transform;
        wall18_transform = wall18_transform.times(Mat4.translation(13.5, 3, 32))
            .times(Mat4.scale(0.5, 5, 9));
        this.shapes.wall.draw(context, program_state, wall18_transform, this.materials.wall);
        this.check_collision(wall18_transform, 0.5, 9);

        let wall19_transform = model_transform;
        wall19_transform = wall19_transform.times(Mat4.translation(34, 3, 35))
            .times(Mat4.scale(10, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall19_transform, this.materials.wall);
        this.check_collision(wall19_transform, 10, 0.5);

        let wall20_transform = model_transform;
        wall20_transform = wall20_transform.times(Mat4.translation(23, 3, 23))
            .times(Mat4.scale(10, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall20_transform, this.materials.wall);
        this.check_collision(wall20_transform, 10, 0.5);

        let wall21_transform = model_transform;
        wall21_transform = wall21_transform.times(Mat4.translation(44.5, 3, 23.5))
            .times(Mat4.scale(0.5, 5, 12));
        this.shapes.wall.draw(context, program_state, wall21_transform, this.materials.wall);
        this.check_collision(wall21_transform, 0.5, 12);

        let wall22_transform = model_transform;
        wall22_transform = wall22_transform.times(Mat4.translation(32.5, 3, -1.5))
            .times(Mat4.scale(0.5, 5, 25));
        this.shapes.wall.draw(context, program_state, wall22_transform, this.materials.wall);
        this.check_collision(wall22_transform, 0.5, 25);

        let wall23_transform = model_transform;
        wall23_transform = wall23_transform.times(Mat4.translation(56, 3, 12))
            .times(Mat4.scale(12, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall23_transform, this.materials.wall);
        this.check_collision(wall23_transform, 12, 0.5);

        let wall24_transform = model_transform;
        wall24_transform = wall24_transform.times(Mat4.translation(52, 3, 0))
            .times(Mat4.scale(8, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall24_transform, this.materials.wall);
        this.check_collision(wall24_transform, 8, 0.5);

        let wall25_transform = model_transform;
        wall25_transform = wall25_transform.times(Mat4.translation(68.5, 3, -2.5))
            .times(Mat4.scale(0.5, 5, 15));
        this.shapes.wall.draw(context, program_state, wall25_transform, this.materials.wall);
        this.check_collision(wall24_transform, 0.5, 15);

        let wall26_transform = model_transform;
        wall26_transform = wall26_transform.times(Mat4.translation(59.5, 3, -8))
            .times(Mat4.scale(0.5, 5, 8));
        this.shapes.wall.draw(context, program_state, wall26_transform, this.materials.wall);
        this.check_collision(wall26_transform, 0.5, 8);
    }
}

//Assignment Shader
class Rug_Texture extends Textured_Phong {
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){
                // Sample the texture image in the correct place:
                vec4 tex_color = texture2D( texture, f_tex_coord);
                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}

class Texture_Scroll extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #6.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){
                // Sample the texture image in the correct place:
                // Translate the texture varying the s texture coord by 
                // 2 texture units/second, causing it to slide along the box faces:
                float slide_trans = mod(animation_time, 4.) * 2.; 
                mat4 slide_matrix = mat4(vec4(-1., 0., 0., 0.), 
                                   vec4( 0., 1., 0., 0.), 
                                   vec4( 0., 0., 1., 0.), 
                                   vec4(slide_trans, 0., 0., 1.)); 
                vec4 new_tex_coord = vec4(f_tex_coord, 0, 0) + vec4(1., 1., 0., 1.); 
                new_tex_coord = slide_matrix * new_tex_coord; 
                vec4 tex_color = texture2D(texture, new_tex_coord.xy);
                
                float u = mod(new_tex_coord.x, 1.0);
                float v = mod(new_tex_coord.y, 1.0);
                
                // left side
                if (u > 0.15 && u < 0.25 && v > 0.15 && v < 0.85) {
                    tex_color = vec4(0, 0, 0, 1.0);
                }
                 
                // right side
                if (u > 0.75 && u < 0.85 && v > 0.15 && v < 0.85) {
                    tex_color = vec4(0, 0, 0, 1.0);
                }
                
                // bottom sode
                if (v > 0.15 && v < 0.25 && u > 0.15 && u < 0.85) {
                    tex_color = vec4(0, 0, 0, 1.0);
                }
                
                // top side
                if (v > 0.75 && v < 0.85 && u > 0.15 && u < 0.85) {
                    tex_color = vec4(0, 0, 0, 1.0);
                }
                
                if( tex_color.w < .01 ) discard;
                
                // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}

//Shaders from Assignment 3
class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){                                                           
                // Compute an initial (ambient) color:
                gl_FragColor = vec4( shape_color.xyz * ambient, shape_color.w );
                // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}

class Ring_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        
        void main(){
          center = model_transform * vec4(0.0, 0.0, 0.0, 1.0);
          point_position = model_transform * vec4(position, 1.0);
          gl_Position = projection_camera_model_transform * vec4(position, 1.0);          
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        void main(){
            float scalar = sin(18.01 * distance(point_position.xyz, center.xyz));
            gl_FragColor = scalar * vec4(0.61, 0.40, 0.1, 1.0);
        }`;
    }
}
