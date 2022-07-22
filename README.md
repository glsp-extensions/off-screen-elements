# Visualizing Off-Screen Elements in GLSP

This is a prototype that demonstrates the visualization of off-screen elements in GLSP. \
It is based on a fork of the original GLSP client on https://github.com/eclipse-glsp/glsp-client. 

![Off-Screen Visualization](/documentation/video_prot2.gif)

## Running the project with docker:

Prerequisites:

- Docker 17.05 or higher
- docker-compose

In the root of this repository, run
```bash
docker-compose up
```
This may take a while. Once both containers have finished building, open http://localhost:8080/diagram.html in your browser.
## Running the project locally:

Prerequisites:

- Node 16 or higher
- Yarn 1.7.0 or higher
- Java 11 or higher


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


## Performance evaluation

Information about the performance evaluation can be found in the branch [performance-evaluation](https://github.com/glsp-extensions/off-screen-elements/tree/performance-evaluation).
