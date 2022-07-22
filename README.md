# Visualizing Off-Screen Elements in GLSP

This is a prototype that demonstrates the visualization of off-screen elements in GLSP. \
It is based on a fork of the original GLSP client on https://github.com/eclipse-glsp/glsp-client.

![Off-Screen Visualization](/documentation/video_prot2.gif)

## Performance evaluation

This branch requires the project to be run locally (instructions below).

First, rebuild the project by running

```bash
yarn build
```

then open the file `glsp-client/examples/workflow-standalone/app/diagram.html` in your browser.

This branch calculates and prints the average rendering time (in milliseconds) of all rendering executions that have been done in the last 5 seconds to the developer console (Shortcut `F12`) of your browser.

Furthermore, it has three additional files inside the `glsp-client/examples/workflow-standalone/app` directory that can be used to evaluate the performance:

-   `example1_10.wf`: 10 Tasks
-   `example1_100.wf`: 100 Tasks
-   `example1_500.wf`: 500 Tasks

In order to run them, rename them to `example1.wf` and refresh your browser.

## Running the project locally:

Prerequisites:

-   Node 16 or higher
-   Yarn 1.7.0 or higher
-   Java 11 or higher

In the root of this repository, run

```bash
yarn install
```

Next, download a pre-built version of the Workflow Example Diagram Server and start it (replace X.X.X with the current version, the download script will print out the correct command on the console):

```bash
yarn download:exampleServer
java -jar org.eclipse.glsp.example.workflow-X.X.X-SNAPSHOT-glsp.jar org.eclipse.glsp.example.workflow.launch.ExampleServerLauncher --port=8081 --websocket
```

Once the server is running, open the `glsp-client/examples/workflow-standalone/app/diagram.html` file in your browser.
