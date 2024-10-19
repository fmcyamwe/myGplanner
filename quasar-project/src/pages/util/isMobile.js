export const isMobile = () => {
    if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
        // true for mobile device
        //document.write("mobile device")
        return true
      }else{
        // false for non mobile device
        
        /*
        console.log("not mobile", navigator.userAgent)
        Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36
         
        */
        // console.log("userAgentData", navigator.userAgentData.mobile)  //warning that it's better to userAgentData  
        return false
      }
}