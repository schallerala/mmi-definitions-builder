const isRunningTsNode = !! process[Symbol.for("ts-node.register.instance")];

const tsPrefix = 'src/';
const distPrefix = 'dist/';
const tsExtension = '.ts';
const jsExtension = '.js';

function composePath (path, withoutExtension) {
   let [prefixFolder, extension] = isRunningTsNode
      ? [tsPrefix, tsExtension]
      : [distPrefix, jsExtension];
   if (withoutExtension)
      extension = ""
   return prefixFolder + path + extension;
}

module.exports = {
   "type": "better-sqlite3",
   "database": "db.sqlite",
   "synchronize": true,
   "logging": false,
   "entities": [
      composePath("entities/*")
   ],
   "migrations": [
      composePath("migrations/*")
   ],
   "subscribers": [
      composePath("subscribers/*")
   ],
   "cli": {
      "entitiesDir": composePath("entities", true),
      "migrationsDir": composePath("migrations", true),
      "subscribersDir": composePath("subscribers", true)
   }
}
