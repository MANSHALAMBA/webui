import * as React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
  makeStyles,
  Paper,
  TextField,
} from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { useEffect, useRef, useState } from 'react';
import { safeLoad } from 'js-yaml';
import { NctrlValue } from '../util/nctrlValue';
import { Fs } from '../util/fs';
import { usePromiseGenerator } from '../util/usePromiseGenerator';
import { NCTRL_BASE_PATH } from '../util/nctrl';
import { NctrlValueSlider, NctrlValueTextfield } from '../components/NctrlValueEdit';
import Typography from '@material-ui/core/Typography';

export const title = 'Dashboard';
export const route = '/dashboard';
export const explanation = `
  The dashboard allows you to control parameters of the camera in a convenient and 
  **set-compatible** way. Here you can set the ISO, exposure time and related parameters.`;

const YAML_PATH = 'dashboard.yml';

const useStyles = makeStyles(theme => ({
  add: {
    position: 'fixed',
    bottom: 0,
    right: 0,
    margin: '50px',
  },
  ul: {
    listStyle: 'none',
    padding: 0,
  },
  notWide: {
    maxWidth: 750,
    padding: 3,
    margin: '10px auto',
    marginBottom: '20px',
  },
}));

export function Component(props) {
  const classes = useStyles();

  const [yaml, setYaml] = useState(null);
  const file_yml = usePromiseGenerator(() => Fs.of(YAML_PATH).load(), YAML_PATH);
  useEffect(() => {
    if (yaml === null && file_yml !== undefined) {
      setYaml(file_yml);
    }
  }, [file_yml]);

  const parsed = useYaml(yaml) || [];

  return (
    <div>
      {
        <AddComponents
          current_yml={yaml}
          setYaml={yaml => {
            setYaml(yaml);
            saveYaml(yaml);
          }}
        />
      }
      <ul className={classes.ul}>
        {parsed.map((x, i) => {
          const InputComponent = input_methods[x.input];
          return (
            <div className={classes.notWide}>
              <Typography variant="h6">{Fs.of(x.path).name()}:</Typography>
              <Paper key={i}>
                <InputComponent {...x} />
              </Paper>
            </div>
          );
        })}
      </ul>
    </div>
  );
}

const input_methods = {
  textfield({ path }) {
    const classes = useStyles();
    const nctrlValue = NctrlValue.of(`${NCTRL_BASE_PATH}/${path}`);

    return <NctrlValueTextfield nctrlValue={nctrlValue} />;
  },
  slider({ path, options }) {
    const classes = useStyles();
    const nctrlValue = NctrlValue.of(`${NCTRL_BASE_PATH}/${path}`);

    return <NctrlValueSlider nctrlValue={nctrlValue} options={options} />;
  },
};

function AddComponents({ current_yml: currentYaml, setYaml }) {
  const classes = useStyles();

  const [dialogOpen, setDialogOpen] = useState(false);
  const inputEl = useRef(null);

  return (
    <>
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Edit Dashboard</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To edit the dashboard, edit the yml description below. It can also be coppied and shared
            (e.g. in the apertus wiki)
          </DialogContentText>
          <TextField
            multiline
            fullWidth
            variant={'filled'}
            label="YAML dashboard description"
            defaultValue={currentYaml}
            inputRef={inputEl}
          ></TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              setDialogOpen(false);
              setYaml(inputEl.current.value);
            }}
            color="primary"
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <Fab
        color="primary"
        className={classes.add}
        aria-label="add"
        onClick={() => setDialogOpen(true)}
      >
        <EditIcon />
      </Fab>
    </>
  );
}

function useYaml(yamlString) {
  const [deserialized, setDeserialized] = useState(null);
  useEffect(() => {
    setDeserialized(safeLoad(yamlString));
  }, [yamlString]);
  return deserialized;
}

function saveYaml(yamlString) {
  Fs.of(YAML_PATH).upload(yamlString);
}
