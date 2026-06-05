import React from 'react';
import { TextInput } from 'react-native';

export default function StyledInput(props) {
  return (
    <TextInput
      {...props}
      style={[
        {
          backgroundColor: '#F1F5F9',
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          marginBottom: 12,
        },
        props.style,
      ]}
      placeholderTextColor="#64748B"
    />
  );
}