
// Exporting the class which will be
// used in another file
// Export keyword or form should be
// used to use the class
export class exportedFile {

    // Class method which prints the
    // user called in another file
    sayHello(user:string){
        return "Hello " + user+ "!";
    }
}