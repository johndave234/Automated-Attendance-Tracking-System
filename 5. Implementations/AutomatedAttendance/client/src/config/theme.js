export const colors = {
  primary: '#1A237E',      // Dark navy blue from logo
  secondary: '#3949AB',    // Medium blue for secondary elements
  accent: '#FF4081',       // Pink accent for important actions
  success: '#4CAF50',      // Green for success states
  warning: '#FFC107',      // Amber for warnings
  error: '#F44336',        // Red for errors
  background: '#F5F6FA',   // Light blue-tinted background
  surface: '#FFFFFF',      // White surface
  text: {
    primary: '#1A237E',    // Dark navy for primary text
    secondary: '#3F51B5',  // Indigo for secondary text
    disabled: '#9FA8DA',   // Light indigo for disabled text
    inverse: '#FFFFFF',    // White text for dark backgrounds
  },
  border: '#E8EAF6',       // Light indigo border
  gradients: {
    primary: ['#1A237E', '#3949AB'],  // Dark to medium blue gradient
    secondary: ['#3949AB', '#5C6BC0'], // Medium to light blue gradient
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body1: {
    fontSize: 16,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  }
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
}; 