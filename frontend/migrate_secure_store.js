const fs = require('fs');
const glob = require('glob'); // Note: if glob is absent, I'll use simple fs traversal

const searchPaths = [
    'app/**/*.tsx',
    'app/**/*.ts',
    'components/**/*.tsx',
    'components/**/*.ts',
    'hooks/**/*.ts',
    'store/**/*.ts',
];

// Simple recursive traversal since glob might not be installed globally
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(path.join(dir, f));
        }
    });
}

const targetDirs = [ 
    path.join(__dirname, 'app'), 
    path.join(__dirname, 'components'), 
    path.join(__dirname, 'hooks'),
    path.join(__dirname, 'store') 
];

let replacedFiles = 0;

targetDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
        walkDir(dir, function(filePath) {
            if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
                let content = fs.readFileSync(filePath, 'utf-8');
                let original = content;

                // Check if file uses TOKEN_KEY and AsyncStorage
                if (content.includes('TOKEN_KEY') && content.includes('AsyncStorage')) {
                    // Replace imports
                    content = content.replace(
                        /import AsyncStorage from ['"]@react-native-async-storage\/async-storage['"];/g, 
                        "import * as SecureStore from 'expo-secure-store';"
                    );

                    // If AsyncStorage is still imported but we use SecureStore:
                    if (!content.includes('expo-secure-store') && (content.includes('getItem') || content.includes('setItem'))) {
                         // Some files might import it differently
                    }

                    // Replace methodical calls manually targeting TOKEN_KEY operations
                    content = content.replace(/AsyncStorage\.getItem\(TOKEN_KEY\)/g, 'SecureStore.getItemAsync(TOKEN_KEY)');
                    content = content.replace(/AsyncStorage\.setItem\(TOKEN_KEY,\s*(.*?)\)/g, 'SecureStore.setItemAsync(TOKEN_KEY, $1)');
                    content = content.replace(/AsyncStorage\.removeItem\(TOKEN_KEY\)/g, 'SecureStore.deleteItemAsync(TOKEN_KEY)');

                    if (original !== content) {
                        fs.writeFileSync(filePath, content, 'utf-8');
                        replacedFiles++;
                        console.log(`Updated: ${filePath}`);
                    }
                }
            }
        });
    }
});

console.log(`Finished migrating ${replacedFiles} files to SecureStore.`);
