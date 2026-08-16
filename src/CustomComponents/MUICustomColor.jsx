import { makeStyles } from "@material-ui/core/styles";
export const MUICustomColor = makeStyles({
    root: {
      // input label when focused
      "& label.Mui-focused": {
        color: "orange"
      },
      // focused color for input with variant='standard'
      "& .MuiInput-underline:after": {
        borderBottomColor: "orange"
      },
      // focused color for input with variant='filled'
      "& .MuiFilledInput-underline:after": {
        borderBottomColor: "orange"
      },
      // focused color for input with variant='outlined'
      "& .MuiOutlinedInput-root": {
        "&.Mui-focused fieldset": {
          borderColor: "orange"
        }
      }
    }
  });