import React from 'react';
import {
    Box,
    Chip,
    Tooltip,
    Typography,
    LinearProgress,
} from '@mui/material';
import {
    CheckCircle,
    Build,
    Schedule,
    Error,
} from '@mui/icons-material';

interface APIIntegrationStatusProps {
    provider: string;
    status: 'ready' | 'in-progress' | 'planned' | 'error';
    endpoint?: string;
}

const APIIntegrationStatus: React.FC<APIIntegrationStatusProps> = ({
    provider,
    status,
    endpoint
}) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'ready':
                return {
                    icon: <CheckCircle sx={{ fontSize: 16 }} />,
                    label: 'Sẵn sàng',
                    color: 'success' as const,
                    tooltip: `API ${provider} đã được tích hợp và sẵn sàng sử dụng`
                };
            case 'in-progress':
                return {
                    icon: <Build sx={{ fontSize: 16 }} />,
                    label: 'Đang phát triển',
                    color: 'warning' as const,
                    tooltip: `Đang tích hợp API ${provider}...`
                };
            case 'planned':
                return {
                    icon: <Schedule sx={{ fontSize: 16 }} />,
                    label: 'Dự kiến',
                    color: 'default' as const,
                    tooltip: `API ${provider} đang được lên kế hoạch tích hợp`
                };
            case 'error':
                return {
                    icon: <Error sx={{ fontSize: 16 }} />,
                    label: 'Lỗi',
                    color: 'error' as const,
                    tooltip: `Có lỗi khi tích hợp API ${provider}`
                };
            default:
                return {
                    icon: <Schedule sx={{ fontSize: 16 }} />,
                    label: 'Chưa xác định',
                    color: 'default' as const,
                    tooltip: 'Trạng thái chưa được xác định'
                };
        }
    };

    const config = getStatusConfig();

    return (
        <Tooltip title={config.tooltip}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip
                    icon={config.icon}
                    label={config.label}
                    size="small"
                    color={config.color}
                    variant="outlined"
                    sx={{
                        fontSize: '0.7rem',
                        height: 20,
                        '& .MuiChip-icon': {
                            fontSize: 14
                        }
                    }}
                />
                {status === 'in-progress' && (
                    <LinearProgress
                        sx={{
                            width: 20,
                            height: 2,
                            borderRadius: 1
                        }}
                    />
                )}
            </Box>
        </Tooltip>
    );
};

export default APIIntegrationStatus;
