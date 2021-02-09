/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = (query) => {
    return new Promise((resolve, reject) => {
        console.log(query);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:4321/query");
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.onload = () => {
            if (xhr.status === 400) {
                return reject(xhr.response)
            }
            return resolve(xhr.response);
        };
        xhr.onerror = (err) => {
            return reject(err);
        };
        xhr.send(JSON.stringify(query));
    });
};
