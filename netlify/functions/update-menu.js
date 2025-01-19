const { Octokit } = require("@octokit/rest");

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: "Method Not Allowed"
        };
    }

    // Verify admin password
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    const authorization = event.headers.authorization;
    if (!authorization || authorization !== `Bearer ${ADMIN_PASSWORD}`) {
        return {
            statusCode: 401,
            body: "Unauthorized"
        };
    }

    try {
        // Parse the incoming menu data
        const menuData = JSON.parse(event.body);

        // Basic validation
        if (!menuData.config || !menuData.navigation || !menuData.menu) {
            throw new Error('Invalid menu structure: missing required top-level sections');
        }

        // Get menu type from the path parameter
        const menuType = event.path.split('/').pop().replace('update-', '');

        // Validate based on menu type
        if (menuType === 'menu' && (!menuData.menu.signature || !menuData.menu.main)) {
            throw new Error('Invalid drinks menu structure: missing signature or main section');
        } else if ((menuType === 'foodmenu' || menuType === 'vipmenu') && !menuData.menu.main) {
            throw new Error(`Invalid ${menuType} structure: missing main section`);
        }

        // Initialize GitHub client
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        // Get the current file's SHA
        const { data: currentFile } = await octokit.repos.getContent({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: `${menuType}.json`
        });

        // Update the file in GitHub
        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: `${menuType}.json`,
            message: 'Update menu via admin interface',
            content: Buffer.from(JSON.stringify(menuData, null, 2)).toString('base64'),
            sha: currentFile.sha,
            branch: 'main'
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Menu updated successfully" })
        };
    } catch (error) {
        console.error('Error updating menu:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
}; 