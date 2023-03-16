import {defs, tiny} from './examples/common.js';
import {Color_Phong_Shader, Shadow_Textured_Phong_Shader, LIGHT_DEPTH_TEX_SIZE} from './examples/shadow-demo-shaders.js';
import { Shape_From_File } from './examples/obj-file-demo.js';

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
        this.birds_eye = Mat4.look_at(vec3(0, 230, 20), vec3(0, 0, 0), vec3(0, 1, 0));

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
            player: new Shape_From_File("assets/Twilight_Character.obj"),
            //player: new defs.Subdivision_Sphere(4),

            //Wall
            wall: new defs.Cube(),
            party: new defs.Cube(),

            vanity: new Shape_From_File("assets/vanity.obj"),

            teapot: new Shape_From_File("assets/teapot.obj"),
        };

        // *** Materials
        this.materials = {
            floor: new Material(new Rug_Texture(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/shag_rug.png")
            }),

            player: new Material(new defs.Phong_Shader(),
                {ambient: 0, diffusivity: 1, specularity: 0,color: hex_color("#f28dae")}),


            vanity: new Material(new defs.Phong_Shader(1),
                {ambient: 0.3, diffusivity: .9, specularity: 1, color: hex_color("#f28dae")}),


            teapot: new Material(new defs.Phong_Shader(1),
                {ambient: 0.3, diffusivity: .9, specularity: 1, color: hex_color("#f28dae")}),

            wall: new Material(new Texture_Scroll(), {
                //color: hex_color("#026B4F"),
                ambient: 1,
                texture: new Texture("assets/wallpaper.png")
            }),

            party: new Material(new Texture_Scroll(), {
                //color: hex_color("#B05DFC"),
                ambient: 1,
                texture: new Texture("assets/party.png")
            }),


            game_over_image: new Material(new Rug_Texture(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/game_over.png")

            }),
        }

        this.pure = new Material(new Color_Phong_Shader(), {
        })

        /* Player initial coordinates */
        this.z_movement = 0;
        this.x_movement = 0;

        this.player_angle = 3.14;

        //collision
        this.collision = false;

    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        //main scene view
        this.key_triggered_button("Initial Camera", ["i"], () => this.attached = () => this.initial_camera_location);

        this.new_line()

        this.key_triggered_button("Attach to Doll", ["Control", "1"], () => this.attached = () => this.player_behind);
        this.new_line();

        this.key_triggered_button("Doll's View", ["v"], () => this.attached = () => this.player_front);
        this.new_line();

        this.key_triggered_button("Bird's Eye View", ["b"], () => this.attached = () => this.birds_eye);
        this.new_line();

        // PLAYER MOVEMENT

        // Up (arrow key up)
        this.key_triggered_button("Up", ['ArrowUp'], () => {

            if (!this.collision) {
                this.z_movement = this.z_movement - 1;
            }
            this.player_angle = 3.14;
            console.log("up pressed");

        });
        // Down (arrow key down)
        this.key_triggered_button("Down", ['ArrowDown'], () => {

            if (!this.collision) {
                this.z_movement = this.z_movement + 1;
            }
            this.player_angle = 0;
            console.log("down pressed");
        });

        // Left (arrow key left)
        this.key_triggered_button("Left", ['ArrowLeft'], () => {
            if (!this.collision) {
                this.x_movement = this.x_movement - 1;
            }
            this.player_angle = 4.71;
            console.log("left pressed");
        });

        // Right Movement (arrow key right)
        this.key_triggered_button("Right", ['ArrowRight'], () => {

            // only allow if it would not result in a collision
            if (!this.collision) {
                this.x_movement = this.x_movement + 1;
            }
            this.player_angle = 1.57;
            //this.collision = false;
            console.log("right pressed");

        });

        this.new_line();

        //Rotation
        // Turn Left (l)
        this.key_triggered_button("Left", ["l"], () => {
            if (!this.collision) {
                this.player_angle = this.player_angle - (1/100);
            }
            console.log("turn left");
        });

        // Turn Right (r)
        this.key_triggered_button("Right", ["r"], () => {
            if (!this.collision) {
                this.player_angle = this.player_angle + (1/100);
            }
            console.log("turn right");
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
        player_transform = player_transform.times(Mat4.translation(this.x_movement, 0, this.z_movement)).times(Mat4.rotation(this.player_angle, 0, 1, 0));
        this.shapes.player.draw(context, program_state, player_transform, this.materials.player);

        //floor
        let floor_transform = model_transform;
        floor_transform = model_transform.times(Mat4.rotation(0, 0, 1, 0))
            .times(Mat4.rotation(Math.PI / 2, 1, 0, 0))
            .times(Mat4.translation(0, 0, 2))
            .times(Mat4.scale(250, 250, 0.5));
        this.shapes.floor.draw(context, program_state, floor_transform, this.materials.floor);

        //teapot
        let teapot_transform = model_transform;
        teapot_transform = teapot_transform.times(Mat4.translation(-8, 0, -3))
            .times(Mat4.scale(1.5, 1.5, 1.5))
            .times(Mat4.rotation(4.7, 1, 0, 0));
        this.shapes.teapot.draw(context, program_state, teapot_transform, this.materials.teapot);

        //vanity
        let vanity_transform = model_transform;
        vanity_transform = vanity_transform.times(Mat4.translation(-45, 3, -25))
            .times(Mat4.rotation(4.7, 1, 0, 0))
            .times(Mat4.rotation(3.14, 0, 0, 1))
            .times(Mat4.scale(2, 2, 2));
            //sofa_transform.times(Mat4.translation(15, 0, -10))
         //   .times(Mat4.scale(2.5, 1, 1));
        //this.shapes.sofa.draw(context, program_state, sofa_transform, this.materials.sofa);
        this.shapes.vanity.draw(context, program_state, vanity_transform, this.materials.vanity);

        this.draw_maze(context, program_state, model_transform);
        //console.log(player_transform);

        let party_transform = model_transform;
        party_transform = party_transform.times(Mat4.translation(64, 3, -50))
            .times(Mat4.scale(10, 5, 10));
        this.shapes.wall.draw(context, program_state, party_transform, this.materials.party);

        // Planet model matrices for camera buttons (5 units away from each planet)
        if(this.player_angle == 3.14){
            this.player_behind = Mat4.inverse(player_transform.times(Mat4.translation(0, 0, -5)).times(Mat4.rotation(3.14, 0, 1, 0)));
            this.player_front = Mat4.inverse(player_transform.times(Mat4.translation(0, 0, 5)).times(Mat4.rotation(3.14, 0, 1, 0)));
        } else if(this.player_angle == 0) {
            this.player_behind = Mat4.inverse(player_transform.times(Mat4.translation(0, 0, -5)).times(Mat4.rotation(3.14, 0, 1, 0)));
            this.player_front = Mat4.inverse(player_transform.times(Mat4.translation(0, 0, 5)).times(Mat4.rotation(3.14, 0, 1, 0)));
        } else if (this.player_angle == 4.71) {
            this.player_behind = Mat4.inverse(player_transform.times(Mat4.translation(0, 0, -5)).times(Mat4.rotation(3.14, 0, 1, 0)));
            this.player_front = Mat4.inverse(player_transform.times(Mat4.translation(0, 0, 5)).times(Mat4.rotation(3.14, 0, 1, 0)));
        } else if(this.player_angle == 1.57) {
            this.player_behind = Mat4.inverse(player_transform.times(Mat4.translation(0, 0, -5)).times(Mat4.rotation(3.14, 0, 1, 0)));
            this.player_front = Mat4.inverse(player_transform.times(Mat4.translation(0, 0, 5)).times(Mat4.rotation(3.14, 0, 1, 0)));
        } else {
            this.player_behind = Mat4.inverse(player_transform.times(Mat4.translation(0, 0, -5)).times(Mat4.rotation(this.player_angle, 0, 1, 0)));
            this.player_front = Mat4.inverse(player_transform.times(Mat4.translation(0, 0, 5)).times(Mat4.rotation(this.player_angle, 0, 1, 0)));
        }



        //if you collided with a wall, game over screen appears
        if (this.collision){
            console.log("game over");

            //camera to set on the game over screen
            program_state.set_camera(Mat4.look_at(vec3(-100, 10, 10), vec3(-100, 10, 0), vec3(0, 1, 0)));
            let game_over_transform = model_transform;
            game_over_transform = game_over_transform.times(Mat4.translation(-100, 10, 0)).times(Mat4.scale(8, 6, 0));
            // -100, 10 , 0
            this.shapes.square.draw(context, program_state, game_over_transform, this.materials.game_over_image);

        }

        if (this.attached != undefined) {
            // Blend desired camera position with existing camera matrix (from previous frame) to smoothly pull camera towards planet
            program_state.camera_inverse = this.attached().map((x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, 0.1));
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
        wall1a_transform = wall1a_transform.times(Mat4.translation(-4, 3, 15.5))
            .times(Mat4.scale(0.5, 5, 13));
        this.shapes.wall.draw(context, program_state, wall1a_transform, this.materials.wall);
        this.check_collision(wall1a_transform, 0.5, 13);

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
        wall10_transform = wall10_transform.times(Mat4.translation(-66, 3, -27))
            .times(Mat4.scale(0.5, 5, 50));
        this.shapes.wall.draw(context, program_state, wall10_transform, this.materials.wall);
        this.check_collision(wall10_transform, 0.5, 50);

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
        wall25_transform = wall25_transform.times(Mat4.translation(68.5, 3, -13.5))
            .times(Mat4.scale(0.5, 5, 25.5));
        this.shapes.wall.draw(context, program_state, wall25_transform, this.materials.wall);
        this.check_collision(wall25_transform, 0.5, 25.5);

        let wall26_transform = model_transform;
        wall26_transform = wall26_transform.times(Mat4.translation(59.5, 3, -20))
            .times(Mat4.scale(0.5, 5, 20));
        this.shapes.wall.draw(context, program_state, wall26_transform, this.materials.wall);
        this.check_collision(wall26_transform, 0.5, 20);

        let wall27_transform = model_transform;
        wall27_transform = wall27_transform.times(Mat4.translation(38.5, 3, -26))
        .times(Mat4.scale(6, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall27_transform, this.materials.wall);
        this.check_collision(wall27_transform, 6, 0.5);

        let wall28_transform = model_transform;
        wall28_transform = wall28_transform.times(Mat4.translation(44, 3, -13))
            .times(Mat4.scale(0.5, 5, 13));
        this.shapes.wall.draw(context, program_state, wall28_transform, this.materials.wall);
        this.check_collision(wall28_transform, 0.5, 13);

        let wall29_transform = model_transform;
        wall29_transform = wall29_transform.times(Mat4.translation(76, 3, -39.5))
            .times(Mat4.scale(8, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall29_transform, this.materials.wall);
        this.check_collision(wall29_transform, 8, 0.5);

        let wall30_transform = model_transform;
        wall30_transform = wall30_transform.times(Mat4.translation(45, 3, -39.5))
            .times(Mat4.scale(15, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall30_transform, this.materials.wall);
        this.check_collision(wall30_transform, 15, 0.5);

        let wall31_transform = model_transform;
        wall31_transform = wall31_transform.times(Mat4.translation(30, 3, -64))
            .times(Mat4.scale(0.5, 5, 25));
        this.shapes.wall.draw(context, program_state, wall31_transform, this.materials.wall);
        this.check_collision(wall31_transform, 0.5, 25);

        let wall32_transform = model_transform;
        wall32_transform = wall32_transform.times(Mat4.translation(10.5, 3, -90))
            .times(Mat4.scale(20, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall32_transform, this.materials.wall);
        this.check_collision(wall32_transform, 20, 0.5);

        let wall33_transform = model_transform;
        wall33_transform = wall33_transform.times(Mat4.translation(17, 3, -75))
            .times(Mat4.scale(13, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall33_transform, this.materials.wall);
        this.check_collision(wall33_transform, 13, 0.5);

        let wall34_transform = model_transform;
        wall34_transform = wall34_transform.times(Mat4.translation(4, 3, -69))
            .times(Mat4.scale(0.5, 5, 6));
        this.shapes.wall.draw(context, program_state, wall34_transform, this.materials.wall);
        this.check_collision(wall34_transform, 0.5, 6);

        let wall35_transform = model_transform;
        wall35_transform = wall35_transform.times(Mat4.translation(-9, 3, -84))
            .times(Mat4.scale(0.5, 5, 6));
        this.shapes.wall.draw(context, program_state, wall35_transform, this.materials.wall);
        this.check_collision(wall35_transform, 0.5, 6);

        let wall36_transform = model_transform;
        wall36_transform = wall36_transform.times(Mat4.translation(-25.5, 3, -63))
            .times(Mat4.scale(30, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall36_transform, this.materials.wall);
        this.check_collision(wall36_transform, 30, 0.5);

        let wall37_transform = model_transform;
        wall37_transform = wall37_transform.times(Mat4.translation(-39, 3, -78))
            .times(Mat4.scale(30, 5, 0.5));
        this.shapes.wall.draw(context, program_state, wall37_transform, this.materials.wall);
        this.check_collision(wall37_transform, 30, 0.5);

        let wall38_transform = model_transform;
        wall38_transform = wall38_transform.times(Mat4.translation(-55, 3, -40))
            .times(Mat4.scale(0.5, 5, 23));
        this.shapes.wall.draw(context, program_state, wall38_transform, this.materials.wall);
        this.check_collision(wall38_transform, 0.5, 23);

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
