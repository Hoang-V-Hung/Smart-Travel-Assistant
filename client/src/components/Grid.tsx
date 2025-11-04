import React from 'react';
import { Grid as MuiGrid, GridProps as MuiGridProps } from '@mui/material';

interface GridProps extends Omit<MuiGridProps, 'item' | 'container'> {
  item?: boolean;
  container?: boolean;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
}

const Grid: React.FC<GridProps> = ({ item, container, ...props }) => {
  return <MuiGrid {...props} />;
};

export default Grid;
