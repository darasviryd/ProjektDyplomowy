import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

export default function StyledButton({ title, onPress, variant = 'primary', style }) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: 'center',
          marginTop: 10,
          backgroundColor: isPrimary ? '#3B82F6' : 'transparent',
          borderWidth: isPrimary ? 0 : 1,
          borderColor: '#CBD5E1',
        },
        style,
      ]}
      activeOpacity={0.85}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: '600',
          color: isPrimary ? '#fff' : '#1F2937',
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}