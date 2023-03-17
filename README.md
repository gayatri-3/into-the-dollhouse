# Into the Dollhouse
Help Twilight Sparkle get to the tea party! 

## Game Overview 
A one-player maze game with a dollhouse theme. 
The player’s objective is to get to the end of maze where there is a tea party. 
There are themed dead ends such as a vanity and a teapot. 

## Installation 
1. git clone https://github.com/gayatri-3/into-the-dollhouse in terminal 
2. Run the host file according to your system
    MacOS: host.command
    Windows: host.bat
3. Go to http://localhost:8080

## How to Play 
* Use the LEFT, RIGHT, UP, DOWN arrow keys to navigate 
* Use the "l" and "r" keys to rotate the camera view 
* Do not collide with the walls -- if you do, it's game over 
* switch between the 4 different camera angles to manuever through the maze ("i" initial camera, "Ctr+1" attach to doll, "v" doll's view, and "b" bird's eye view)

## Features
1. User Interaction: player can navigate through the maze with up, down, left, and right arrow keys
2. Collision Detection: when player collides with walls, game over screen appears; when player collides with tea party, winner (final tea party) scene appears
3. Camera Perspectives: 4 different camera perspectives that users can change between ("i" initial camera, "Ctr+1" attach to doll, "v" doll's view, and "b" bird's eye view)
4. Texture & Shading: walls, floor, and end screens implement a textured phong shader to support image imports
5. Illumination: 

## Credits

Gayatri
* Interactivity: Player movement with arrow keys
* Collision Detection 
* Camera Perspectives ("i" initial camera, "Ctr+1" attach to doll, "v" doll's view) 
* Import object files

Pavana
* Transformation of objects (walls, dead ends, etc)
* Texture Mapping (for floor, walls)
* Camera Perspective ("b" birds eye view)
