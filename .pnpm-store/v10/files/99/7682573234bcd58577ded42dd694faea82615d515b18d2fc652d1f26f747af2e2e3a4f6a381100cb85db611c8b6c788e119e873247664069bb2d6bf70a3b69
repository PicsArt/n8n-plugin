"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Build = void 0;
const n8n_core_1 = require("n8n-core");
const command_1 = require("@oclif/command");
const src_1 = require("../src");
class Build extends command_1.Command {
    async run() {
        const { flags } = this.parse(Build);
        this.log('\nBuild credentials and nodes');
        this.log('=========================');
        try {
            const options = {};
            if (flags.destination) {
                options.destinationFolder = flags.destination;
            }
            if (flags.watch) {
                options.watch = true;
            }
            const outputDirectory = await (0, src_1.buildFiles)(options);
            this.log(`The nodes got built and saved into the following folder:\n${outputDirectory}`);
        }
        catch (error) {
            this.log(`\nGOT ERROR: "${error.message}"`);
            this.log('====================================');
            this.log(error.stack);
        }
    }
}
exports.Build = Build;
Build.description = 'Builds credentials and nodes and copies it to n8n custom extension folder';
Build.examples = [
    '$ n8n-node-dev build',
    '$ n8n-node-dev build --destination ~/n8n-nodes',
    '$ n8n-node-dev build --watch',
];
Build.flags = {
    help: command_1.flags.help({ char: 'h' }),
    destination: command_1.flags.string({
        char: 'd',
        description: `The path to copy the compiles files to [default: ${n8n_core_1.UserSettings.getUserN8nFolderCustomExtensionPath()}]`,
    }),
    watch: command_1.flags.boolean({
        description: 'Starts in watch mode and automatically builds and copies file whenever they change',
    }),
};
//# sourceMappingURL=build.js.map