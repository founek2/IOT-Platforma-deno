export function sleep(seconds: number, disableLog?: boolean) {
    if (!disableLog)
        console.log("sleeping for", seconds, "seconds...")
    return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000);
    });
}
