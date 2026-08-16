import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";

const top100Films = [
  { label: "Kano", year: 1994 },
  { label: "Jigawa", year: 1972 },
];

export default function LivingFrom() {
  const [selectedValue, setSelectedValue] = useState(null);

  const handleAutocompleteChange = (event, newValue) => {
    setSelectedValue(newValue);
  };

  return (
    <>    
      <Autocomplete
        disablePortal  id="combo-box-demo"
        options={top100Films}
        fullWidth
        sx={{ width: 300 }}
        value={selectedValue}
        onChange={handleAutocompleteChange}
        renderInput={(params) => <TextField {...params} label="Living from" />}
      />
      <p>Selected Value: {selectedValue ? selectedValue.label : ""}</p>
    </>
  );
}
